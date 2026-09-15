import type { Proposta, StatusProposta } from "./types";

export type UnidadePeriodo = "semana" | "mes";

export interface Faixa {
  inicio: Date;
  fim: Date;
}

export interface Contagem {
  count: number;
  valor: number;
}

export interface ResumoPeriodo {
  faixa: Faixa;
  total: Contagem;
  porStatus: Record<StatusProposta, Contagem>;
  emAberto: Contagem;
  concluida: Contagem;
  naoAprovada: Contagem;
  taxaConversao: number | null;
  ticketMedio: number | null;
  porVendedor: Record<string, Contagem>;
}

export interface Delta {
  abs: number;
  pct: number | null;
}

export interface Comparativo {
  unidade: UnidadePeriodo;
  atual: ResumoPeriodo;
  anterior: ResumoPeriodo;
  rotuloAtual: string;
  rotuloAnterior: string;
}

export interface PontoSerie {
  rotulo: string;
  inicio: string;
  concluidaCount: number;
  concluidaValor: number;
  atual: boolean;
}

const STATUS_EM_ABERTO: StatusProposta[] = ["rascunho", "pendente", "aguardando", "aprovada"];

const TODOS_STATUS: StatusProposta[] = [
  "rascunho",
  "pendente",
  "aguardando",
  "aprovada",
  "concluida",
  "nao_aprovada",
  "modelo",
];

function contagemVazia(): Contagem {
  return { count: 0, valor: 0 };
}

function somar(a: Contagem, p: Proposta): Contagem {
  return { count: a.count + 1, valor: a.valor + p.valor };
}

function addDiasUTC(d: Date, dias: number): Date {
  const novo = new Date(d);
  novo.setUTCDate(novo.getUTCDate() + dias);
  return novo;
}

function paraDataUTC(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function noIntervalo(iso: string, inicio: Date, fim: Date): boolean {
  const d = paraDataUTC(iso);
  return d.getTime() >= inicio.getTime() && d.getTime() <= fim.getTime();
}

/** Segunda-feira da semana que contém `d`. */
export function inicioDaSemana(d: Date): Date {
  const diaSemana = d.getUTCDay(); // 0=domingo..6=sábado
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;
  return addDiasUTC(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())), deslocamento);
}

export function inicioDoMes(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function ultimoDiaDoMesAnterior(d: Date): number {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0)).getUTCDate();
}

/** Datas do período "até hoje" (semana ou mês) e do período equivalente anterior. */
export function faixasComparativas(referencia: Date, unidade: UnidadePeriodo): { atual: Faixa; anterior: Faixa } {
  if (unidade === "semana") {
    const inicioAtual = inicioDaSemana(referencia);
    return {
      atual: { inicio: inicioAtual, fim: referencia },
      anterior: { inicio: addDiasUTC(inicioAtual, -7), fim: addDiasUTC(referencia, -7) },
    };
  }

  const inicioAtual = inicioDoMes(referencia);
  const diaEquivalente = Math.min(referencia.getUTCDate(), ultimoDiaDoMesAnterior(referencia));
  const inicioAnterior = new Date(Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth() - 1, 1));
  const fimAnterior = new Date(Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth() - 1, diaEquivalente));
  return {
    atual: { inicio: inicioAtual, fim: referencia },
    anterior: { inicio: inicioAnterior, fim: fimAnterior },
  };
}

export function resumoDoPeriodo(propostas: Proposta[], faixa: Faixa): ResumoPeriodo {
  const doPeriodo = propostas.filter((p) => p.status !== "modelo" && noIntervalo(p.dataCriacao, faixa.inicio, faixa.fim));

  const porStatus = Object.fromEntries(TODOS_STATUS.map((s) => [s, contagemVazia()])) as Record<StatusProposta, Contagem>;
  const porVendedor: Record<string, Contagem> = {};
  let total = contagemVazia();

  for (const p of doPeriodo) {
    porStatus[p.status] = somar(porStatus[p.status], p);
    total = somar(total, p);
    if (p.status === "concluida") {
      porVendedor[p.vendedor] = somar(porVendedor[p.vendedor] ?? contagemVazia(), p);
    }
  }

  const emAberto = STATUS_EM_ABERTO.reduce(
    (acc, s) => ({ count: acc.count + porStatus[s].count, valor: acc.valor + porStatus[s].valor }),
    contagemVazia()
  );
  const concluida = porStatus.concluida;
  const naoAprovada = porStatus.nao_aprovada;
  const resolvidas = concluida.count + naoAprovada.count;

  return {
    faixa,
    total,
    porStatus,
    emAberto,
    concluida,
    naoAprovada,
    taxaConversao: resolvidas > 0 ? concluida.count / resolvidas : null,
    ticketMedio: concluida.count > 0 ? concluida.valor / concluida.count : null,
    porVendedor,
  };
}

function formatarRotuloFaixa(faixa: Faixa): string {
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
  return `${fmt(faixa.inicio)}–${fmt(faixa.fim)}`;
}

export function compararPeriodo(
  propostas: Proposta[],
  unidade: UnidadePeriodo,
  referencia: Date
): Comparativo {
  const { atual, anterior } = faixasComparativas(referencia, unidade);
  return {
    unidade,
    atual: resumoDoPeriodo(propostas, atual),
    anterior: resumoDoPeriodo(propostas, anterior),
    rotuloAtual: formatarRotuloFaixa(atual),
    rotuloAnterior: formatarRotuloFaixa(anterior),
  };
}

export function calcularDelta(atual: number, anterior: number): Delta {
  const abs = atual - anterior;
  const pct = anterior !== 0 ? abs / anterior : atual > 0 ? null : 0;
  return { abs, pct };
}

/** Série das últimas N semanas (ou meses) de propostas concluídas, para o gráfico de tendência. */
export function serieTendencia(propostas: Proposta[], unidade: UnidadePeriodo, referencia: Date, pontos = 8): PontoSerie[] {
  const inicioAtual = unidade === "semana" ? inicioDaSemana(referencia) : inicioDoMes(referencia);
  const passo = unidade === "semana" ? 7 : null;

  const serie: PontoSerie[] = [];
  for (let i = pontos - 1; i >= 0; i--) {
    let inicio: Date;
    let fim: Date;
    if (unidade === "semana") {
      inicio = addDiasUTC(inicioAtual, -i * (passo as number));
      fim = i === 0 ? referencia : addDiasUTC(inicio, 6);
    } else {
      inicio = new Date(Date.UTC(inicioAtual.getUTCFullYear(), inicioAtual.getUTCMonth() - i, 1));
      fim = i === 0 ? referencia : new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + 1, 0));
    }

    const concluidas = propostas.filter(
      (p) => p.status === "concluida" && noIntervalo(p.dataCriacao, inicio, fim)
    );

    serie.push({
      rotulo:
        unidade === "semana"
          ? inicio.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" })
          : inicio.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", ""),
      inicio: inicio.toISOString().slice(0, 10),
      concluidaCount: concluidas.length,
      concluidaValor: concluidas.reduce((acc, p) => acc + p.valor, 0),
      atual: i === 0,
    });
  }
  return serie;
}

/** Rascunhos criados há mais de `limiteDias` e ainda sem movimentação — achado recorrente nos prints enviados. */
export function rascunhosParados(propostas: Proposta[], referencia: Date, limiteDias = 15): Contagem {
  return propostas
    .filter((p) => p.status === "rascunho")
    .filter((p) => {
      const dias = Math.round((referencia.getTime() - paraDataUTC(p.dataCriacao).getTime()) / 86_400_000);
      return dias >= limiteDias;
    })
    .reduce(somar, contagemVazia());
}
