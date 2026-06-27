import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

export function ServiceAdminOnlyState({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Only administrators can manage the clinic service catalog.</p>
        </CardContent>
      </Card>
    </div>
  );
}
