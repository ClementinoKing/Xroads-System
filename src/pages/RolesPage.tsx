import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { roles as initialRoles, type RoleDefinition } from "../data/roles";
import { AddRoleModal } from "../components/roles/AddRoleModal";

const accessBadgeClasses: Record<string, string> = {
  "Full access": "bg-xroads-50 text-xroads-700 ring-xroads-200",
  "Operational access": "bg-sky-50 text-sky-700 ring-sky-200",
  "Limited access": "bg-slate-100 text-slate-700 ring-slate-200",
};

export function RolesPage() {
  const [roleItems, setRoleItems] = useState<RoleDefinition[]>(initialRoles);
  const [createOpen, setCreateOpen] = useState(false);

  function handleCreateRole(role: RoleDefinition) {
    setRoleItems((current) => [role, ...current]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Roles</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Define access levels and permissions for each staff role.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus size={17} />
          Add role
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roleItems.map((role) => (
          <Card key={role.id} className="border-slate-200">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{role.name}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{role.description}</p>
                </div>
                <Badge className={accessBadgeClasses[role.accessLevel]}>{role.accessLevel}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Assigned users</span>
                <span className="font-semibold text-slate-950 dark:text-slate-50">{role.userCount}</span>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-950 dark:text-slate-50">Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((permission) => (
                    <Badge key={permission} className="bg-slate-100 text-slate-700 ring-slate-200 dark:bg-zinc-900 dark:text-slate-200 dark:ring-zinc-800">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddRoleModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateRole}
        existingRoleNames={roleItems.map((role) => role.name)}
      />
    </div>
  );
}
