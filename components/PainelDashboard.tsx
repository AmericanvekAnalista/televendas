"use client";

import { useState } from "react";
import Link from "next/link";
import { StatTile } from "./StatTile";
import { EstagiosFunil } from "./EstagiosFunil";
import { TendenciaConcluidas } from "./TendenciaConcluidas";
import { RankingVendedores } from "./RankingVendedores";
import { CurvaABC } from "./CurvaABC";
import type { Comparativo, Contagem, PontoSerie, UnidadePeriodo } from "@/lib/metrics";
import { calcularDelta } from "@/lib/metrics";
import type { ResumoCurvaABC } from "@/lib/curva-abc";
import { formatarMoeda, formatarMoedaCompacta, formatarNumero, formatarPercentual } from "@/lib/format";

interface PainelDashboardProps {
  comparativos: Record<UnidadePeriodo, Comparativo>;
  series: Record<UnidadePeriodo, PontoSerie[]>;
  rascunhosParados: Contagem;
  curvaABC: ResumoCurvaABC;
  fonteDados: "amostra" | "importado";
}

const SEM_DELTA = { abs: 0, pct: null } as const;

export function PainelDashboard({ comparativos, series, rascunhosParados, curvaABC, fonteDados }: PainelDashboardProps) {
  const [unidade, setUnidade] = useState<UnidadePeriodo>("semana");
  const comp = comparativos[unidade];
  const serie = series[unidade];
  const rotuloAnterior = unidade === "semana" ? "vs. semana anterior" : "vs. mês anterior";

  const deltaNovas = calcularDelta(comp.atual.total.count, comp.anterior.total.count);
  const deltaConcluidaValor = calcularDelta(comp.atual.concluida.valor, comp.anterior.concluida.valor);
  const deltaConversao =
    comp.atual.taxaConversao !== null && comp.anterior.taxaConversao !== null
      ? calcularDelta(comp.atual.taxaConversao, comp.anterior.taxaConversao)
      : SEM_DELTA;
  const deltaTicket =
    comp.atual.ticketMedio !== null && comp.anterior.ticketMedio !== null
      ? calcularDelta(comp.atual.ticketMedio, comp.anterior.ticketMedio)
      : SEM_DELTA;
  const deltaEmAbertoValor = calcularDelta(comp.atual.emAberto.valor, comp.anterior.emAberto.valor);

  return (
    <div className="flex flex-col gap-6">
      {fonteDados === "amostra" ? (
        <div className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-secondary">
          <strong className="text-text-primary">Dados de exemplo.</strong> Estes números foram reconstruídos a
          partir dos prints do Tiny (ago/set de 2026) mais dados gerados para completar o histórico — ainda não é
          uma integração ao vivo com o ERP.{" "}
          <Link href="/importar" className="font-medium text-text-primary underline underline-offset-2">
            Importar planilha real
          </Link>
          .
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary sm:text-2xl">Televendas — Propostas Comerciais</h1>
          <p className="text-sm text-text-muted">
            Período atual <span className="text-text-secondary">{comp.rotuloAtual}</span> · anterior{" "}
            <span className="text-text-secondary">{comp.rotuloAnterior}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <Link href="/importar" className="text-sm font-medium text-text-secondary hover:text-text-primary">
            Importar dados
          </Link>
          <div className="flex rounded-lg border border-border p-0.5">
          {(["semana", "mes"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnidade(u)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                unidade === u ? "bg-text-primary text-background" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {u === "semana" ? "Semana" : "Mês"}
            </button>
          ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
        <StatTile
          label="Novas propostas"
          value={formatarNumero(comp.atual.total.count)}
          subvalor={formatarMoedaCompacta(comp.atual.total.valor)}
          delta={deltaNovas}
          rotuloComparacao={rotuloAnterior}
        />
        <StatTile
          label="Concluídas (ganhas)"
          value={formatarMoedaCompacta(comp.atual.concluida.valor)}
          subvalor={`${formatarNumero(comp.atual.concluida.count)} proposta${comp.atual.concluida.count === 1 ? "" : "s"}`}
          delta={deltaConcluidaValor}
          rotuloComparacao={rotuloAnterior}
        />
        <StatTile
          label="Taxa de conversão"
          value={comp.atual.taxaConversao !== null ? formatarPercentual(comp.atual.taxaConversao) : "—"}
          delta={deltaConversao}
          rotuloComparacao={rotuloAnterior}
        />
        <StatTile
          label="Ticket médio"
          value={comp.atual.ticketMedio !== null ? formatarMoeda(comp.atual.ticketMedio) : "—"}
          delta={deltaTicket}
          rotuloComparacao={rotuloAnterior}
        />
        <StatTile
          label="Em aberto (backlog)"
          value={formatarMoedaCompacta(comp.atual.emAberto.valor)}
          subvalor={`${formatarNumero(comp.atual.emAberto.count)} proposta${comp.atual.emAberto.count === 1 ? "" : "s"}`}
          delta={deltaEmAbertoValor}
          direcaoBoa="down"
          rotuloComparacao={rotuloAnterior}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EstagiosFunil porStatus={comp.atual.porStatus} />
        <RankingVendedores porVendedor={comp.atual.porVendedor} />
      </div>

      <TendenciaConcluidas serie={serie} unidade={unidade} />

      <CurvaABC resumo={curvaABC} />

      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-text-secondary">Rascunhos parados há 15+ dias</h3>
            <p className="text-xs text-text-muted">
              Propostas enviadas e nunca movimentadas — candidatas a retomar contato ou encerrar
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-xl font-semibold text-text-primary">{formatarNumero(rascunhosParados.count)}</div>
            <div className="text-sm text-text-muted">{formatarMoedaCompacta(rascunhosParados.valor)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
