import { createClient } from "npm:@supabase/supabase-js@2";

const DEFAULT_PASSWORD = "12345678";
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

function resolveStatus(rawStatus?: string | null) {
  const normalizedStatus = rawStatus?.trim().toLowerCase() ?? "";

  if (normalizedStatus === "invited" || normalizedStatus === "suspended") {
    return normalizedStatus;
  }

  return "active";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
    return json(403, { error: "Only administrators can create staff accounts." });
  }

  const payload = await req.json().catch(() => null) as {
    name?: string;
    email?: string;
    roleId?: string;
    role?: string;
    branchId?: string | null;
    status?: string;
  } | null;

  const name = payload?.name?.trim() ?? "";
  const email = payload?.email?.trim().toLowerCase() ?? "";
  const roleId = resolveRoleId(payload?.roleId, payload?.role);
  const legacyRole = resolveLegacyRole(roleId);
  const branchId = payload?.branchId?.trim() ?? null;
  const status = resolveStatus(payload?.status);

  if (!name || !email || !roleId) {
    return json(400, { error: "Missing required user details." });
  }

  if (!isValidEmail(email)) {
    return json(400, { error: "A valid email address is required." });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: roleRecord, error: roleError } = await adminClient.from("roles").select("id").eq("id", roleId).maybeSingle();

  if (roleError || !roleRecord) {
    return json(400, { error: "The selected role does not exist." });
  }

  if (branchId) {
    const { data: branchRecord, error: branchError } = await adminClient.from("branches").select("id").eq("id", branchId).maybeSingle();

    if (branchError || !branchRecord) {
      return json(400, { error: "The selected branch does not exist." });
    }
  }

  const metadata = {
    full_name: name,
    name,
    role: roleId,
    role_id: roleId,
    branch_id: branchId ?? "",
    status,
    must_change_password: "true",
  };

  const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (createError || !createdUser.user) {
    return json(400, { error: createError?.message ?? "Could not create the user." });
  }

  const { data: profileRecord, error: profileUpsertError } = await adminClient
    .from("profiles")
    .upsert({
      id: createdUser.user.id,
      full_name: name,
      email,
      role: legacyRole,
      role_id: roleId,
      status,
      branch_id: branchId,
      must_change_password: true,
      metadata,
    })
    .select("id")
    .single();

  if (profileUpsertError || !profileRecord) {
    await adminClient.auth.admin.deleteUser(createdUser.user.id);
    return json(400, { error: profileUpsertError?.message ?? "Could not create the profile." });
  }

  return json(200, {
    userId: createdUser.user.id,
    email: createdUser.user.email,
    profileId: profileRecord.id,
    temporaryPassword: DEFAULT_PASSWORD,
  });
});
