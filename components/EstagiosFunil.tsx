"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useModo } from "@/lib/use-modo";
import { CORES } from "@/lib/theme";
import { ESTAGIOS_FUNIL, STATUS_LABEL, type StatusProposta } from "@/lib/types";
import type { Contagem } from "@/lib/metrics";
import { formatarMoedaCompacta, formatarNumero } from "@/lib/format";
import { ChartTooltipCard } from "./ChartTooltipCard";

interface EstagiosFunilProps {
  porStatus: Record<StatusProposta, Contagem>;
}

interface LinhaFunil {
  estagio: string;
  quantidade: number;
  valor: number;
  cor: string;
}

export function EstagiosFunil({ porStatus }: EstagiosFunilProps) {
  const modo = useModo();
  const cores = CORES[modo];

  const dados: LinhaFunil[] = ESTAGIOS_FUNIL.map((status, i) => ({
    estagio: STATUS_LABEL[status],
    quantidade: porStatus[status].count,
    valor: porStatus[status].valor,
    cor: cores.ordinal[i],
  }));

  const naoAprovada = porStatus.nao_aprovada;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <h3 className="mb-1 text-sm font-medium text-text-secondary">Funil de propostas no período</h3>
      <p className="mb-4 text-xs text-text-muted">Quantidade de propostas criadas no período, pela etapa atual</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={dados} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="estagio"
            width={92}
            tickLine={false}
            axisLine={false}
            tick={{ fill: cores.textSecondary, fontSize: 13 }}
          />
          <Tooltip
            cursor={{ fill: cores.grid, opacity: 0.5 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as LinhaFunil;
              return (
                <ChartTooltipCard
                  titulo={d.estagio}
                  linhas={[
                    { rotulo: "Propostas", valor: formatarNumero(d.quantidade), cor: d.cor },
                    { rotulo: "Valor", valor: formatarMoedaCompacta(d.valor) },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="quantidade" radius={[0, 4, 4, 0]} maxBarSize={22} minPointSize={2} isAnimationActive={false}>
            {dados.map((d) => (
              <Cell key={d.estagio} fill={d.cor} />
            ))}
            <LabelList dataKey="quantidade" position="right" formatter={(v) => formatarNumero(Number(v))} fill={cores.textPrimary} fontSize={13} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-1 flex items-center justify-between rounded-lg border border-border px-3 py-2">
        <span className="text-sm text-text-secondary">Não aprovadas (perdas) no período</span>
        <span className="text-sm font-semibold" style={{ color: cores.status.critical }}>
          {formatarNumero(naoAprovada.count)} · {formatarMoedaCompacta(naoAprovada.valor)}
        </span>
      </div>
    </div>
  );
}
