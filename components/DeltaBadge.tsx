import type { Delta } from "@/lib/metrics";
import { formatarPercentual } from "@/lib/format";

interface DeltaBadgeProps {
  delta: Delta;
  /** Se um valor maior é uma boa notícia (padrão) ou uma má notícia (ex: backlog aberto). */
  direcaoBoa?: "up" | "down";
  /** Rótulo do período de comparação, ex: "vs. semana anterior". */
  rotulo?: string;
}

export function DeltaBadge({ delta, direcaoBoa = "up", rotulo }: DeltaBadgeProps) {
  const subiu = delta.abs > 0;
  const neutro = delta.abs === 0;

  const boa = neutro ? null : (direcaoBoa === "up") === subiu;
  const cor = neutro ? "text-text-muted" : boa ? "text-delta-up" : "text-delta-down";
  const seta = neutro ? "•" : subiu ? "▲" : "▼";

  const texto = delta.pct === null ? (neutro ? "sem variação" : subiu ? "novo" : "—") : formatarPercentual(Math.abs(delta.pct), 0);

  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${cor}`}>
      <span aria-hidden>{seta}</span>
      <span>{texto}</span>
      {rotulo ? <span className="font-normal text-text-muted">{rotulo}</span> : null}
    </span>
  );
}
