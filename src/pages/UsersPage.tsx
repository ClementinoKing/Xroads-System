import { Plus } from "lucide-react";
import { branches } from "../data/branches";
import { users } from "../data/users";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Users & roles</h1>
          <p className="mt-1 text-sm text-slate-500">Role-based staff access preview for clinic operations.</p>
        </div>
        <Button><Plus size={17} /> Add user</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Staff accounts</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Branch assignment</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Last login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-950">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-5 py-4"><Badge className="bg-xroads-50 text-xroads-700 ring-xroads-200">{user.role}</Badge></td>
                  <td className="px-5 py-4 text-slate-600">{user.branchId === "All branches" ? "All branches" : branches.find((branch) => branch.id === user.branchId)?.name}</td>
                  <td className="px-5 py-4"><Badge className={user.status === "Active" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200"}>{user.status}</Badge></td>
                  <td className="px-5 py-4 text-slate-600">{user.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
