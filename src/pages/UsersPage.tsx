import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Plus } from "lucide-react";
import { branches } from "../data/branches";
import { users as initialUsers, type UserAccount } from "../data/users";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { AddUserModal } from "../components/users/AddUserModal";

export function UsersPage() {
  const [userItems, setUserItems] = useState<UserAccount[]>(initialUsers);
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  function handleCreateUser(user: UserAccount) {
    setUserItems((current) => [user, ...current]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Manage staff accounts, assignments, and access status.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus size={17} />
          Add user
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Staff accounts</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500 dark:text-slate-400 dark:text-slate-500">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Branch assignment</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Last login</th>
                <th className="px-5 py-3">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {userItems.map((user) => (
                <tr key={user.id} className="transition hover:bg-slate-50 dark:hover:bg-zinc-900/60">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-950 dark:text-slate-50">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-5 py-4"><Badge className="bg-xroads-50 text-xroads-700 ring-xroads-200">{user.role}</Badge></td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{user.branchId === "All branches" ? "All branches" : branches.find((branch) => branch.id === user.branchId)?.name}</td>
                  <td className="px-5 py-4"><Badge className={user.status === "Active" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200"}>{user.status}</Badge></td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{user.lastLogin}</td>
                  <td className="px-5 py-4">
                    <Button type="button" variant="outline" className="h-9 px-3 text-xs" onClick={() => navigate(`/users/${user.id}`)}>
                      View profile
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <AddUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateUser}
        existingEmails={userItems.map((user) => user.email)}
      />
    </div>
  );
}
