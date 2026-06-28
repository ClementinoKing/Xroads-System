import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { cn } from "../../lib/utils";
import type { DentalChartTooth, SurfaceNote, ToothCondition, ToothSurfaceCode } from "../../features/dental-chart/dental-chart-types";
import { SURFACE_OPTIONS, TOOTH_CONDITIONS } from "../../features/dental-chart/dental-chart-types";

type ToothInspectorProps = {
  toothCode: string | null;
  tooth: DentalChartTooth | null;
  canEdit: boolean;
  surfaceDraft: {
    surfaceCode: ToothSurfaceCode;
    note: string;
  };
  onSurfaceDraftChange: (next: { surfaceCode: ToothSurfaceCode; note: string }) => void;
  onConditionChange: (condition: ToothCondition) => void;
  onPlannedTreatmentChange: (value: string) => void;
  onCompletedTreatmentChange: (value: string) => void;
  onAddSurfaceNote: () => void;
  onRemoveSurfaceNote: (surfaceCode: ToothSurfaceCode) => void;
};

export function ToothInspector({
  toothCode,
  tooth,
  canEdit,
  surfaceDraft,
  onSurfaceDraftChange,
  onConditionChange,
  onPlannedTreatmentChange,
  onCompletedTreatmentChange,
  onAddSurfaceNote,
  onRemoveSurfaceNote,
}: ToothInspectorProps) {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-2">
        <CardTitle className="text-[1.05rem]">Tooth inspector</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {toothCode ? `Editing tooth ${toothCode}.` : "Select a tooth from the odontogram to record clinical findings."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {toothCode && tooth ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-xroads-50 text-xroads-700 ring-xroads-200 dark:bg-xroads-500/15 dark:text-xroads-100 dark:ring-xroads-900/50">
                Tooth {toothCode}
              </Badge>
              <Badge className={cn("ring-1", getConditionTone(tooth.condition))}>{tooth.condition}</Badge>
            </div>

            <Field label="Tooth condition">
              <select
                className="input h-11 text-sm"
                value={tooth.condition}
                disabled={!canEdit}
                onChange={(event) => onConditionChange(event.target.value as ToothCondition)}
              >
                {TOOTH_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Planned treatment">
              <textarea
                className="input min-h-28 py-3 text-sm"
                value={tooth.plannedTreatment}
                disabled={!canEdit}
                onChange={(event) => onPlannedTreatmentChange(event.target.value)}
                placeholder="Describe the treatment planned for this tooth."
              />
            </Field>

            <Field label="Completed treatment">
              <textarea
                className="input min-h-28 py-3 text-sm"
                value={tooth.completedTreatment}
                disabled={!canEdit}
                onChange={(event) => onCompletedTreatmentChange(event.target.value)}
                placeholder="Record treatment that has already been completed."
              />
            </Field>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Surface notes</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Capture notes for a specific surface on the selected tooth.</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                <select
                  className="input h-11 text-sm"
                  value={surfaceDraft.surfaceCode}
                  disabled={!canEdit}
                  onChange={(event) =>
                    onSurfaceDraftChange({
                      ...surfaceDraft,
                      surfaceCode: event.target.value as ToothSurfaceCode,
                    })
                  }
                >
                  {SURFACE_OPTIONS.map((surface) => (
                    <option key={surface.value} value={surface.value}>
                      {surface.label}
                    </option>
                  ))}
                </select>
                <textarea
                  className="input min-h-24 py-3 text-sm"
                  value={surfaceDraft.note}
                  disabled={!canEdit}
                  onChange={(event) =>
                    onSurfaceDraftChange({
                      ...surfaceDraft,
                      note: event.target.value,
                    })
                  }
                  placeholder="Write a note for the selected surface."
                />
              </div>

              <div className="flex justify-end">
                <Button type="button" variant="outline" className="h-10" onClick={onAddSurfaceNote} disabled={!canEdit || surfaceDraft.note.trim() === ""}>
                  Add note
                </Button>
              </div>

              <div className="space-y-2">
                {tooth.surfaceNotes.length > 0 ? (
                  tooth.surfaceNotes.map((surfaceNote) => (
                    <SurfaceNoteRow
                      key={`${surfaceNote.surfaceCode}-${surfaceNote.note}`}
                      note={surfaceNote}
                      canEdit={canEdit}
                      onRemove={() => onRemoveSurfaceNote(surfaceNote.surfaceCode)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No surface notes recorded yet.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-slate-400">
            Choose a tooth to start charting clinical details.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function SurfaceNoteRow({ note, canEdit, onRemove }: { note: SurfaceNote; canEdit: boolean; onRemove: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{note.surfaceCode}</p>
        <p className="text-sm text-slate-700 dark:text-slate-200">{note.note}</p>
      </div>
      <Button type="button" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500" onClick={onRemove} disabled={!canEdit} aria-label={`Remove ${note.surfaceCode} surface note`}>
        <Trash2 size={16} />
      </Button>
    </div>
  );
}

function getConditionTone(condition: ToothCondition | string) {
  switch (condition) {
    case "Caries":
      return "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-100 dark:ring-rose-900/50";
    case "Missing":
      return "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-zinc-800 dark:text-slate-200 dark:ring-zinc-700";
    case "Filled":
      return "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-100 dark:ring-sky-900/50";
    case "Crown":
      return "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-100 dark:ring-amber-900/50";
    case "Extraction planned":
      return "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-100 dark:ring-orange-900/50";
    case "Root canal":
      return "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-100 dark:ring-violet-900/50";
    case "Fracture":
      return "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-100 dark:ring-red-900/50";
    case "Observation":
      return "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700";
    default:
      return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-100 dark:ring-emerald-900/50";
  }
}
