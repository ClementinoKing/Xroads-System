import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ROLE_MAP: Record<string, string> = {
  "super admin": "super_admin",
  "branch admin": "branch_admin",
  receptionist: "receptionist",
  dentist: "dentist",
  finance: "finance",
};

const LEGACY_ROLE_IDS = new Set(["super_admin", "branch_admin", "receptionist", "dentist", "finance"]);

function resolveRoleId(payloadRoleId?: string | null, payloadRole?: string | null) {
  const directRoleId = payloadRoleId?.trim().toLowerCase() ?? "";

  if (directRoleId) {
    return directRoleId;
  }

  const roleLabel = payloadRole?.trim().toLowerCase() ?? "";
  return ROLE_MAP[roleLabel] ?? "";
}

function resolveLegacyRole(roleId: string) {
  return LEGACY_ROLE_IDS.has(roleId) ? roleId : "receptionist";
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: "Missing Supabase function configuration." });
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return json(401, { error: "Missing authorization header." });
  }

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userResult, error: userError } = await authClient.auth.getUser();
  if (userError || !userResult.user) {
    return json(401, { error: "Unable to verify the current user." });
  }

  const { data: profile, error: profileError } = await authClient
    .from("profiles")
    .select("id, role_id")
    .eq("id", userResult.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return json(403, { error: "Your account profile could not be loaded." });
  }

  if (!["super_admin", "branch_admin"].includes(profile.role_id)) {
    return json(403, { error: "Only administrators can update staff accounts." });
  }

  const payload = await req.json().catch(() => null) as {
    userId?: string;
    name?: string;
    email?: string;
    roleId?: string;
    role?: string;
    branchId?: string | null;
    status?: string;
  } | null;

  const userId = payload?.userId?.trim() ?? "";
  const name = payload?.name?.trim() ?? "";
  const email = payload?.email?.trim().toLowerCase() ?? "";
  const roleId = resolveRoleId(payload?.roleId, payload?.role);
  const legacyRole = resolveLegacyRole(roleId);
  const branchId = payload?.branchId?.trim() ?? null;
  const rawStatus = payload?.status?.trim().toLowerCase() ?? "";
  const status = rawStatus === "invited" || rawStatus === "suspended" ? rawStatus : "active";

  if (!userId || !name || !email || !roleId) {
    return json(400, { error: "Missing required user details." });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: roleRecord, error: roleError } = await adminClient.from("roles").select("id").eq("id", roleId).maybeSingle();

  if (roleError || !roleRecord) {
    return json(400, { error: "The selected role does not exist." });
  }

  const { data: existingProfile, error: existingProfileError } = await adminClient
    .from("profiles")
    .select("metadata, must_change_password")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfileError || !existingProfile) {
    return json(404, { error: "The selected user could not be found." });
  }

  const mergedMetadata = {
    ...(existingProfile.metadata ?? {}),
    full_name: name,
    name,
    role: roleId,
    role_id: roleId,
    branch_id: branchId ?? "",
    status,
  };

  const { data: authUpdate, error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, {
    email,
    user_metadata: mergedMetadata,
    email_confirm: true,
  });

  if (authUpdateError || !authUpdate.user) {
    return json(400, { error: authUpdateError?.message ?? "Could not update the user." });
  }

  const { data: profileUpdate, error: profileUpdateError } = await adminClient
    .from("profiles")
    .update({
      full_name: name,
      email,
      role: legacyRole,
      role_id: roleId,
      status,
      branch_id: branchId,
      metadata: mergedMetadata,
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (profileUpdateError || !profileUpdate) {
    return json(400, { error: profileUpdateError?.message ?? "Could not update the profile." });
  }

  return json(200, {
    userId,
    email: authUpdate.user.email,
    profileId: profileUpdate.id,
  });
});
