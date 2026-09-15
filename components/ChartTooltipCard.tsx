interface LinhaTooltip {
  rotulo: string;
  valor: string;
  cor?: string;
}

interface ChartTooltipCardProps {
  titulo?: string;
  linhas: LinhaTooltip[];
}

export function ChartTooltipCard({ titulo, linhas }: ChartTooltipCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-md">
      {titulo ? <div className="mb-1 font-medium text-text-primary">{titulo}</div> : null}
      <div className="flex flex-col gap-0.5">
        {linhas.map((l) => (
          <div key={l.rotulo} className="flex items-center gap-2 text-text-secondary">
            {l.cor ? <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: l.cor }} /> : null}
            <span>{l.rotulo}:</span>
            <span className="font-medium text-text-primary">{l.valor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
