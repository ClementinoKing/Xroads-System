import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    return json(403, { error: "Only administrators can delete staff accounts." });
  }

  const payload = await req.json().catch(() => null) as { userId?: string } | null;
  const userId = payload?.userId?.trim() ?? "";

  if (!userId) {
    return json(400, { error: "Missing user identifier." });
  }

  if (userId === userResult.user.id) {
    return json(400, { error: "You cannot delete your own account." });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const archivedAt = new Date().toISOString();
  const { error: profileUpdateError } = await adminClient
    .from("profiles")
    .update({
      deleted_at: archivedAt,
      status: "suspended",
    })
    .eq("id", userId);

  if (profileUpdateError) {
    return json(400, { error: profileUpdateError.message });
  }

  return json(200, {
    userId,
  });
});
