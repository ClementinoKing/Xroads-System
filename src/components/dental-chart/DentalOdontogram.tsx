import { useEffect, useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import type { DentalChartTooth, DentalDentitionType, ToothCondition, ToothSurfaceCode } from "../../features/dental-chart/dental-chart-types";

type DentalOdontogramProps = {
  dentitionType: DentalDentitionType;
  selectedToothCode: string | null;
  teethByCode: Map<string, DentalChartTooth>;
  onSelectTooth: (toothCode: string | null) => void;
  onSurfaceSelect?: (toothCode: string, surfaceCode: ToothSurfaceCode) => void;
  readOnly?: boolean;
};

type SurfaceKey = "B" | "L" | "M" | "D" | "O";

type ToothPosition = {
  toothCode: string;
  x: number;
  y: number;
};

type ActiveSurface = {
  toothCode: string;
  surfaceCode: ToothSurfaceCode;
};

const ADULT_UPPER_RIGHT = ["18", "17", "16", "15", "14", "13", "12", "11"];
const ADULT_UPPER_LEFT = ["21", "22", "23", "24", "25", "26", "27", "28"];
const ADULT_LOWER_LEFT = ["38", "37", "36", "35", "34", "33", "32", "31"];
const ADULT_LOWER_RIGHT = ["41", "42", "43", "44", "45", "46", "47", "48"];

const CONDITION_COLORS: Record<ToothCondition, string> = {
  Healthy: "#fffdf7",
  Caries: "#ef4444",
  Filled: "#3b82f6",
  Crown: "#facc15",
  Missing: "#d1d5db",
  "Extraction planned": "#f97316",
  "Root canal": "#8b5cf6",
  Fracture: "#dc2626",
  Observation: "#cbd5e1",
};

const CONDITION_STROKES: Record<ToothCondition, string> = {
  Healthy: "#8b949e",
  Caries: "#dc2626",
  Filled: "#2563eb",
  Crown: "#ca8a04",
  Missing: "#111827",
  "Extraction planned": "#ea580c",
  "Root canal": "#7c3aed",
  Fracture: "#991b1b",
  Observation: "#94a3b8",
};

const CONDITION_LABELS: Record<ToothCondition, string> = {
  Healthy: "Healthy",
  Caries: "Caries",
  Filled: "Filling",
  Crown: "Crown",
  Missing: "Missing",
  "Extraction planned": "Extraction Planned",
  "Root canal": "Root Canal",
  Fracture: "Fracture",
  Observation: "Observation",
};

export function DentalOdontogram({
  dentitionType,
  selectedToothCode,
  teethByCode,
  onSelectTooth,
  onSurfaceSelect,
  readOnly = false,
}: DentalOdontogramProps) {
  const [activeSurface, setActiveSurface] = useState<ActiveSurface | null>(null);

  useEffect(() => {
    if (activeSurface && activeSurface.toothCode !== selectedToothCode) {
      setActiveSurface(null);
    }
  }, [activeSurface, selectedToothCode]);

  const toothPositions = useMemo<ToothPosition[]>(() => {
    const startX = 44;
    const gap = 62;

    return [
      ...ADULT_UPPER_RIGHT.map((toothCode, index) => ({ toothCode, x: startX + index * gap, y: 78 })),
      ...ADULT_UPPER_LEFT.map((toothCode, index) => ({ toothCode, x: startX + (index + 8) * gap, y: 78 })),
      ...ADULT_LOWER_LEFT.map((toothCode, index) => ({ toothCode, x: startX + index * gap, y: 225 })),
      ...ADULT_LOWER_RIGHT.map((toothCode, index) => ({ toothCode, x: startX + (index + 8) * gap, y: 225 })),
    ];
  }, []);

  const selectedTooth = selectedToothCode ? teethByCode.get(selectedToothCode) : null;
  const selectedCondition = selectedTooth?.condition ?? "Healthy";
  const selectedSurfaceLabel = activeSurface ? `${selectedToothCode ?? activeSurface.toothCode} · ${activeSurface.surfaceCode}` : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Odontogram</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Click a tooth surface to select the tooth and sync the inspector.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={selectedCondition}>{CONDITION_LABELS[selectedCondition]}</Badge>
          {selectedSurfaceLabel ? (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-300">
              {selectedSurfaceLabel}
            </span>
          ) : null}
        </div>
      </div>

      {dentitionType !== "permanent" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          This SVG odontogram is currently rendered for permanent dentition. The clinical chart data still saves for primary
          and mixed dentition.
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-[#fbfdff] p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <svg
          className="block min-w-[1060px]"
          width="1060"
          height="340"
          viewBox="0 0 1060 340"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="toothShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="1.4" floodColor="#000000" floodOpacity="0.12" />
            </filter>
          </defs>

          <text x="530" y="35" textAnchor="middle" fontSize="16" fontWeight="700" fill="#374151">
            Upper Arch
          </text>
          <text x="530" y="185" textAnchor="middle" fontSize="16" fontWeight="700" fill="#374151">
            Lower Arch
          </text>
          <line x1="530" y1="55" x2="530" y2="305" stroke="#d1d5db" strokeDasharray="5 6" />

          {toothPositions.map((position) => {
            const tooth = teethByCode.get(position.toothCode);
            return (
              <ToothSvg
                key={position.toothCode}
                toothCode={position.toothCode}
                x={position.x}
                y={position.y}
                tooth={tooth}
                isSelected={selectedToothCode === position.toothCode}
                activeSurface={activeSurface}
                onSelect={(surfaceCode) => {
                  if (readOnly) {
                    return;
                  }

                  const mappedSurfaceCode = mapSurfaceKeyToSurfaceCode(surfaceCode);
                  setActiveSurface({ toothCode: position.toothCode, surfaceCode: mappedSurfaceCode });
                  onSelectTooth(position.toothCode);
                  onSurfaceSelect?.(position.toothCode, mappedSurfaceCode);
                }}
                readOnly={readOnly}
              />
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Surfaces</span>
        <LegendDot label="B" description="Buccal" />
        <LegendDot label="L" description="Lingual" />
        <LegendDot label="M" description="Mesial" />
        <LegendDot label="D" description="Distal" />
        <LegendDot label="O" description="Occlusal" />
      </div>
    </div>
  );
}

function ToothSvg({
  toothCode,
  x,
  y,
  tooth,
  isSelected,
  activeSurface,
  onSelect,
  readOnly,
}: {
  toothCode: string;
  x: number;
  y: number;
  tooth: DentalChartTooth | undefined;
  isSelected: boolean;
  activeSurface: ActiveSurface | null;
  onSelect: (surfaceCode: SurfaceKey) => void;
  readOnly: boolean;
}) {
  const toothType = getToothType(toothCode);
  const outerPath = getToothOuterPath(toothType);
  const occlusalPath = getOcclusalPath(toothType);
  const toothState = tooth?.condition ?? "Healthy";
  const fillColor = CONDITION_COLORS[toothState];
  const strokeColor = CONDITION_STROKES[toothState];
  const fullToothMissing = toothState === "Missing";

  const surfacePaths: Record<SurfaceKey, string> = {
    B: `
      M 0 0
      H 56
      V 24
      C 43 20, 36 19, 28 19
      C 20 19, 13 20, 0 24
      Z
    `,
    L: `
      M 0 60
      H 56
      V 36
      C 43 40, 36 41, 28 41
      C 20 41, 13 40, 0 36
      Z
    `,
    M: `
      M 0 0
      H 22
      C 18 18, 18 42, 22 60
      H 0
      Z
    `,
    D: `
      M 56 0
      H 34
      C 38 18, 38 42, 34 60
      H 56
      Z
    `,
    O: occlusalPath,
  };

  return (
    <g transform={`translate(${x}, ${y})`} aria-label={`Tooth ${toothCode}`}>
      <text x="28" y="-8" textAnchor="middle" fontSize="13" fontWeight="700" fill="#374151" pointerEvents="none">
        {toothCode}
      </text>

      <defs>
        <clipPath id={`clip-${toothCode}`}>
          <path d={outerPath} />
        </clipPath>
      </defs>

      <path
        d={outerPath}
        fill="#fffdf7"
        stroke="#8b949e"
        strokeWidth="1.2"
        filter="url(#toothShadow)"
        pointerEvents="none"
      />

      <g clipPath={`url(#clip-${toothCode})`}>
        {(Object.keys(surfacePaths) as SurfaceKey[]).map((surface) => {
          const selected = activeSurface?.toothCode === toothCode && activeSurface.surfaceCode === mapSurfaceKeyToSurfaceCode(surface);
          const surfaceFill = getSurfaceFill(toothState, fillColor);
          const surfaceOpacity = getSurfaceOpacity(toothState);

          return (
            <path
              key={surface}
              d={surfacePaths[surface]}
              fill={surfaceFill}
              opacity={surfaceOpacity}
              stroke={selected ? "#2563eb" : "#9ca3af"}
              strokeWidth={selected ? "2.2" : "0.8"}
              className={cn("transition", readOnly ? "cursor-default" : "cursor-pointer")}
              onClick={() => onSelect(surface)}
            />
          );
        })}
      </g>

      <path
        d={outerPath}
        fill="none"
        stroke={isSelected ? "#2563eb" : fullToothMissing ? "#111827" : strokeColor}
        strokeWidth={isSelected ? "2.2" : fullToothMissing ? "1.8" : "1.1"}
        pointerEvents="none"
      />

      <g stroke="#9ca3af" strokeWidth="0.8" fill="none" opacity="0.75" pointerEvents="none">
        {getAnatomicalLines(toothType).map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      {fullToothMissing ? (
        <g pointerEvents="none">
          <line x1="9" y1="10" x2="47" y2="50" stroke="#111827" strokeWidth="2.2" />
          <line x1="47" y1="10" x2="9" y2="50" stroke="#111827" strokeWidth="2.2" />
        </g>
      ) : null}
    </g>
  );
}

function getSurfaceFill(condition: ToothCondition, fallback: string) {
  if (condition === "Healthy") {
    return "#fffdf7";
  }

  return fallback;
}

function getSurfaceOpacity(condition: ToothCondition) {
  return condition === "Healthy" ? 1 : 0.78;
}

function mapSurfaceKeyToSurfaceCode(surfaceCode: SurfaceKey): ToothSurfaceCode {
  switch (surfaceCode) {
    case "B":
      return "Buccal";
    case "L":
      return "Lingual";
    case "M":
      return "Mesial";
    case "D":
      return "Distal";
    case "O":
      return "Occlusal";
  }
}

function getToothType(toothNumber: string) {
  const lastDigit = toothNumber.slice(-1);
  if (["6", "7", "8"].includes(lastDigit)) return "molar";
  if (["4", "5"].includes(lastDigit)) return "premolar";
  if (lastDigit === "3") return "canine";
  return "incisor";
}

function getToothOuterPath(type: ReturnType<typeof getToothType>) {
  switch (type) {
    case "molar":
      return `
        M 9 10
        C 5 13, 4 21, 5 30
        C 5 39, 8 47, 15 50
        C 20 53, 25 50, 29 50
        C 33 50, 38 53, 43 50
        C 50 47, 53 39, 53 30
        C 54 21, 53 13, 49 10
        C 44 6, 37 8, 33 7
        C 29 5, 25 5, 21 7
        C 17 8, 13 6, 9 10
        Z
      `;
    case "premolar":
      return `
        M 18 8
        C 11 10, 7 18, 7 30
        C 7 42, 14 51, 25 52
        C 36 53, 45 45, 46 32
        C 47 19, 41 10, 33 8
        C 28 6, 23 6, 18 8
        Z
      `;
    case "canine":
      return `
        M 28 5
        C 19 9, 12 22, 10 35
        C 9 44, 17 53, 28 55
        C 39 53, 47 44, 46 35
        C 44 22, 37 9, 28 5
        Z
      `;
    default:
      return `
        M 17 7
        C 12 9, 10 16, 10 28
        C 10 42, 17 53, 28 54
        C 39 53, 46 42, 46 28
        C 46 16, 44 9, 39 7
        C 33 6, 23 6, 17 7
        Z
      `;
  }
}

function getOcclusalPath(type: ReturnType<typeof getToothType>) {
  switch (type) {
    case "molar":
      return `
        M 19 20
        C 23 16, 33 16, 38 20
        C 43 24, 43 35, 38 39
        C 33 43, 23 43, 18 39
        C 13 34, 14 24, 19 20
        Z
      `;
    case "premolar":
      return `
        M 22 19
        C 28 14, 38 19, 40 29
        C 41 38, 34 45, 26 44
        C 18 43, 13 36, 15 28
        C 16 24, 18 21, 22 19
        Z
      `;
    case "canine":
      return `
        M 28 17
        C 23 23, 19 32, 20 39
        C 23 43, 33 43, 36 39
        C 37 32, 33 23, 28 17
        Z
      `;
    default:
      return `
        M 18 16
        C 23 13, 33 13, 38 16
        C 39 25, 39 36, 36 44
        C 31 47, 24 47, 20 44
        C 17 36, 17 25, 18 16
        Z
      `;
  }
}

function getAnatomicalLines(type: ReturnType<typeof getToothType>) {
  switch (type) {
    case "molar":
      return [
        "M 18 28 C 24 31, 31 31, 38 28",
        "M 28 18 C 27 25, 27 35, 28 42",
        "M 18 22 C 21 25, 23 27, 25 30",
        "M 39 22 C 35 25, 33 27, 31 30",
        "M 19 39 C 23 36, 25 34, 28 32",
        "M 38 39 C 34 36, 32 34, 29 32",
      ];
    case "premolar":
      return ["M 20 25 C 25 29, 32 29, 37 25", "M 28 18 C 27 27, 27 36, 28 44", "M 20 36 C 25 33, 31 33, 36 36"];
    case "canine":
      return ["M 28 14 C 25 25, 24 36, 27 48", "M 28 14 C 33 25, 34 36, 29 48"];
    default:
      return ["M 18 18 C 24 21, 32 21, 38 18", "M 20 44 C 25 47, 31 47, 36 44", "M 28 17 C 27 27, 27 38, 28 49"];
  }
}

function Badge({ tone, children }: { tone: ToothCondition; children: string }) {
  const activeClass =
    tone === "Healthy"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-100"
      : tone === "Missing"
        ? "border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-200"
        : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-500/10 dark:text-sky-100";

  return (
    <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold shadow-sm", activeClass)}>
      {children}
    </span>
  );
}

function LegendDot({ label, description }: { label: SurfaceKey; description: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <span className="text-slate-400 dark:text-slate-500">{description}</span>
    </span>
  );
}
