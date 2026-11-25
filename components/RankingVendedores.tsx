"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useModo } from "@/lib/use-modo";
import { CORES } from "@/lib/theme";
import type { Contagem } from "@/lib/metrics";
import { formatarMoedaCompacta, formatarNumero } from "@/lib/format";
import { ChartTooltipCard } from "./ChartTooltipCard";

interface RankingVendedoresProps {
  porVendedor: Record<string, Contagem>;
}

interface LinhaRanking {
  vendedor: string;
  quantidade: number;
  valor: number;
}

export function RankingVendedores({ porVendedor }: RankingVendedoresProps) {
  const modo = useModo();
  const cores = CORES[modo];

  const dados: LinhaRanking[] = Object.entries(porVendedor)
    .map(([vendedor, c]) => ({ vendedor, quantidade: c.count, valor: c.valor }))
    .sort((a, b) => b.valor - a.valor);

  if (dados.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h3 className="mb-1 text-sm font-medium text-text-secondary">Concluídas por vendedor(a)</h3>
        <p className="text-sm text-text-muted">Nenhuma proposta concluída no período.</p>
      </div>
    );
  }

  const altura = Math.max(120, dados.length * 44);

  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <h3 className="mb-1 text-sm font-medium text-text-secondary">Concluídas por vendedor(a)</h3>
      <p className="mb-4 text-xs text-text-muted">Valor de propostas concluídas no período, por responsável</p>
      <ResponsiveContainer width="100%" height={altura}>
        <BarChart data={dados} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="vendedor"
            width={92}
            tickLine={false}
            axisLine={false}
            tick={{ fill: cores.textSecondary, fontSize: 13 }}
          />
          <Tooltip
            cursor={{ fill: cores.grid, opacity: 0.5 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as LinhaRanking;
              return (
                <ChartTooltipCard
                  titulo={d.vendedor}
                  linhas={[
                    { rotulo: "Concluídas", valor: formatarNumero(d.quantidade), cor: cores.categorico[0] },
                    { rotulo: "Valor", valor: formatarMoedaCompacta(d.valor) },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="valor" radius={[0, 4, 4, 0]} maxBarSize={24} fill={cores.categorico[0]} isAnimationActive={false}>
            <LabelList dataKey="valor" position="right" formatter={(v) => formatarMoedaCompacta(Number(v))} fill={cores.textPrimary} fontSize={13} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
