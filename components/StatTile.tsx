import type { Delta } from "@/lib/metrics";
import { DeltaBadge } from "./DeltaBadge";

interface StatTileProps {
  label: string;
  value: string;
  subvalor?: string;
  delta?: Delta;
  direcaoBoa?: "up" | "down";
  rotuloComparacao?: string;
}

export function StatTile({ label, value, subvalor, delta, direcaoBoa, rotuloComparacao }: StatTileProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-2xl font-semibold text-text-primary sm:text-[28px]">{value}</span>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-h-5">
        {subvalor ? <span className="text-sm text-text-muted">{subvalor}</span> : null}
        {delta ? <DeltaBadge delta={delta} direcaoBoa={direcaoBoa} rotulo={rotuloComparacao} /> : null}
      </div>
    </div>
  );
}
