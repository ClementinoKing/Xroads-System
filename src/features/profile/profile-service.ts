import { supabase } from "../../lib/supabase";
import { isNetworkErrorMessage, toConnectivityError } from "../../lib/network-errors";

const AVATAR_BUCKET = "avatars";
const PROFILE_SELECT =
  "id, full_name, email, role_id, status, branch_id, phone, avatar_url, last_login_at, created_at, updated_at";

const profileCache = new Map<string, ProfileRecord>();

export type ProfileRecord = {
  id: string;
  full_name: string;
  email: string;
  role_id: string;
  status: "active" | "invited" | "suspended";
  branch_id: string | null;
  phone: string | null;
  avatar_url: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RoleRecord = {
  id: string;
  name: string;
  description: string | null;
  access_level: string;
  is_system_role: boolean;
};

export type BranchRecord = {
  id: string;
  name: string;
  address: string;
  status: "open" | "closed";
  hours: string | null;
};

export type ProfileFormValues = {
  fullName: string;
  phone: string;
};

export type ProfileAvatarUploadResult = {
  avatarUrl: string | null;
  error: string | null;
};

export function getCachedProfile(userId: string) {
  return profileCache.get(userId) ?? null;
}

function setCachedProfile(profile: ProfileRecord | null) {
  if (!profile) {
    return;
  }

  profileCache.set(profile.id, profile);
}

export async function loadProfile(userId: string) {
  const [profileResult, rolesResult, branchesResult] = await Promise.all([
    supabase.from("profiles").select(PROFILE_SELECT).eq("id", userId).maybeSingle(),
    supabase.from("roles").select("id, name, description, access_level, is_system_role").order("name", { ascending: true }),
    supabase.from("branches").select("id, name, address, status, hours").order("name", { ascending: true }),
  ]);

  if (profileResult.error) {
    return { profile: null, roles: [], branches: [], error: isNetworkErrorMessage(profileResult.error.message) ? toConnectivityError("load the profile") : profileResult.error.message };
  }

  if (rolesResult.error) {
    return {
      profile: profileResult.data as ProfileRecord | null,
      roles: [],
      branches: [],
      error: isNetworkErrorMessage(rolesResult.error.message) ? toConnectivityError("load the roles list") : rolesResult.error.message,
    };
  }

  if (branchesResult.error) {
    return {
      profile: profileResult.data as ProfileRecord | null,
      roles: rolesResult.data ?? [],
      branches: [],
      error: isNetworkErrorMessage(branchesResult.error.message) ? toConnectivityError("load the branches list") : branchesResult.error.message,
    };
  }

  return {
    profile: (() => {
      const profile = (profileResult.data as ProfileRecord | null) ?? null;
      setCachedProfile(profile);
      return profile;
    })(),
    roles: (rolesResult.data as RoleRecord[]) ?? [],
    branches: (branchesResult.data as BranchRecord[]) ?? [],
    error: null,
  };
}

export async function saveProfile(userId: string, values: ProfileFormValues) {
  const authResult = await supabase.auth.updateUser(
    {
      data: {
        full_name: values.fullName,
        name: values.fullName,
        phone: values.phone || "",
      },
    },
  );

  if (authResult.error) {
    return { profile: null, error: authResult.error.message };
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: values.fullName,
      phone: values.phone || null,
    })
    .eq("id", userId)
    .select(PROFILE_SELECT)
    .maybeSingle();

  if (profileError) {
    return { profile: null, error: profileError.message };
  }

  return {
    profile: (() => {
      const profile = profileData as ProfileRecord | null;
      setCachedProfile(profile);
      return profile;
    })(),
    error: null,
  };
}

export async function changeEmail(userId: string, emailInput: string) {
  const email = emailInput.trim().toLowerCase();
  const emailRedirectTo = typeof window !== "undefined" ? `${window.location.origin}/profile` : undefined;

  const authResult = await supabase.auth.updateUser(
    {
      email,
    },
    emailRedirectTo ? { emailRedirectTo } : {},
  );

  if (authResult.error) {
    return { profile: null, error: authResult.error.message };
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .update({
      email,
    })
    .eq("id", userId)
    .select(PROFILE_SELECT)
    .maybeSingle();

  if (profileError) {
    return { profile: null, error: profileError.message };
  }

  return {
    profile: (() => {
      const profile = profileData as ProfileRecord | null;
      setCachedProfile(profile);
      return profile;
    })(),
    error: null,
  };
}

export async function uploadProfileAvatar(userId: string, file: File): Promise<ProfileAvatarUploadResult> {
  const uploadPath = buildAvatarUploadPath(userId, file);

  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(uploadPath, file, {
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) {
    return { avatarUrl: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(uploadPath);
  const avatarUrl = data.publicUrl;

  const { error: profileError } = await supabase.auth.updateUser({
    data: {
      avatar_url: avatarUrl,
    },
  });

  if (profileError) {
    return { avatarUrl: null, error: profileError.message };
  }

  const { error: dbError } = await supabase
    .from("profiles")
    .update({
      avatar_url: avatarUrl,
    })
    .eq("id", userId);

  if (dbError) {
    return { avatarUrl: null, error: dbError.message };
  }

  return { avatarUrl, error: null };
}

export async function updatePassword(userId: string, password: string) {
  const [authResult, profileResult] = await Promise.all([
    supabase.auth.updateUser({
      password,
      data: {
        must_change_password: false,
      },
    }),
    supabase
      .from("profiles")
      .update({
        must_change_password: false,
        status: "active",
      })
      .eq("id", userId)
      .select("id")
      .maybeSingle(),
  ]);

  if (authResult.error) {
    return { error: authResult.error.message };
  }

  if (profileResult.error) {
    return { error: profileResult.error.message };
  }

  return { error: null as string | null };
}

function buildAvatarUploadPath(userId: string, file: File) {
  const extension = getFileExtension(file.name) ?? getFileExtension(file.type) ?? "png";
  return `${userId}/${crypto.randomUUID()}.${extension}`;
}

function getFileExtension(value: string) {
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) {
    return null;
  }

  if (trimmed.includes("/")) {
    const mimeParts = trimmed.split("/");
    const mimeSubType = mimeParts[mimeParts.length - 1];

    if (!mimeSubType || mimeSubType === "jpeg") {
      return mimeSubType === "jpeg" ? "jpg" : null;
    }

    return mimeSubType.split("+")[0] || null;
  }

  const segments = trimmed.split(".");
  if (segments.length < 2) {
    return null;
  }

  return segments[segments.length - 1] || null;
}
