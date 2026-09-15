"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useModo } from "@/lib/use-modo";
import { CORES } from "@/lib/theme";
import type { PontoSerie, UnidadePeriodo } from "@/lib/metrics";
import { formatarMoedaCompacta, formatarNumero } from "@/lib/format";
import { ChartTooltipCard } from "./ChartTooltipCard";

interface TendenciaConcluidasProps {
  serie: PontoSerie[];
  unidade: UnidadePeriodo;
}

export function TendenciaConcluidas({ serie, unidade }: TendenciaConcluidasProps) {
  const modo = useModo();
  const cores = CORES[modo];
  const rotuloUnidade = unidade === "semana" ? "semanas" : "meses";

  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <h3 className="mb-1 text-sm font-medium text-text-secondary">Propostas concluídas — últimas {rotuloUnidade}</h3>
      <p className="mb-4 text-xs text-text-muted">Valor concluído por período; o período atual está em destaque</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={cores.grid} />
          <XAxis dataKey="rotulo" tickLine={false} axisLine={{ stroke: cores.axis }} tick={{ fill: cores.textMuted, fontSize: 12 }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fill: cores.textMuted, fontSize: 12 }}
            tickFormatter={(v: number) => formatarMoedaCompacta(v)}
          />
          <Tooltip
            cursor={{ fill: cores.grid, opacity: 0.5 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as PontoSerie;
              return (
                <ChartTooltipCard
                  titulo={d.rotulo}
                  linhas={[
                    { rotulo: "Concluídas", valor: formatarNumero(d.concluidaCount), cor: d.atual ? cores.categorico[0] : cores.deEmphasis },
                    { rotulo: "Valor", valor: formatarMoedaCompacta(d.concluidaValor) },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="concluidaValor" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false}>
            {serie.map((d) => (
              <Cell key={d.inicio} fill={d.atual ? cores.categorico[0] : cores.deEmphasis} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
