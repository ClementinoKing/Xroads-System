import type { User } from "@supabase/supabase-js";
import type { AuthProfile } from "./auth-context";

function readMetadataValue(user: User | null, keys: string[]) {
  if (!user) {
    return null;
  }

  for (const key of keys) {
    const value = user.user_metadata?.[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function toTitleCase(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getAuthDisplayName(user: User | null, profile?: AuthProfile | null) {
  return profile?.full_name ?? readMetadataValue(user, ["full_name", "name"]) ?? user?.email?.split("@")[0] ?? "Account";
}

export function getAuthRoleLabel(user: User | null, profile?: AuthProfile | null) {
  return toTitleCase(profile?.role_id ?? readMetadataValue(user, ["role"]) ?? "signed_in_user");
}
