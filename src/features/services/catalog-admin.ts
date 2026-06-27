const SERVICE_ADMIN_ROLE_IDS = new Set(["super_admin", "branch_admin"]);

export function canManageServiceCatalog(roleId?: string | null) {
  return SERVICE_ADMIN_ROLE_IDS.has(roleId ?? "");
}
