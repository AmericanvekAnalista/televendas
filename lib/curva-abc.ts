import { noIntervalo, type Faixa } from "./metrics";
import type { ItemVendido } from "./store";

export type ClasseABC = "A" | "B" | "C";

const LIMITE_A = 0.8;
const LIMITE_B = 0.95;

export interface ProdutoAgregado {
  produtoId: number;
  sku: string | null;
  descricao: string;
  valor: number;
  quantidade: number;
  /** Fração 0-1 (combina com `formatarPercentual`). */
  percentualIndividual: number;
  percentualAcumulado: number;
  classe: ClasseABC;
}

export interface ResumoCurvaABC {
  faixa: Faixa;
  /** Ordenados por valor decrescente — já na ordem certa pra Curva ABC. */
  produtos: ProdutoAgregado[];
  porClasse: Record<ClasseABC, { count: number; valor: number; percentual: number }>;
  valorTotal: number;
}

function classificar(percentualAcumulado: number): ClasseABC {
  if (percentualAcumulado <= LIMITE_A) return "A";
  if (percentualAcumulado <= LIMITE_B) return "B";
  return "C";
}

export function resumoCurvaABC(itens: ItemVendido[], faixa: Faixa): ResumoCurvaABC {
  const doPeriodo = itens.filter((i) => noIntervalo(i.dataCriacao, faixa.inicio, faixa.fim));

  interface Agregado {
    sku: string | null;
    descricao: string;
    valor: number;
    quantidade: number;
  }
  const porProduto = new Map<number, Agregado>();
  for (const item of doPeriodo) {
    const atual = porProduto.get(item.produtoId);
    if (atual) {
      atual.valor += item.valorTotal;
      atual.quantidade += item.quantidade;
    } else {
      porProduto.set(item.produtoId, {
        sku: item.sku,
        descricao: item.descricao,
        valor: item.valorTotal,
        quantidade: item.quantidade,
      });
    }
  }

  const valorTotal = Array.from(porProduto.values()).reduce((acc, p) => acc + p.valor, 0);
  const ordenados = Array.from(porProduto.entries())
    .map(([produtoId, p]) => ({ produtoId, ...p }))
    .sort((a, b) => b.valor - a.valor);

  let acumulado = 0;
  const produtos: ProdutoAgregado[] = ordenados.map((p) => {
    acumulado += p.valor;
    const percentualAcumulado = valorTotal > 0 ? acumulado / valorTotal : 0;
    return {
      produtoId: p.produtoId,
      sku: p.sku,
      descricao: p.descricao,
      valor: p.valor,
      quantidade: p.quantidade,
      percentualIndividual: valorTotal > 0 ? p.valor / valorTotal : 0,
      percentualAcumulado,
      classe: classificar(percentualAcumulado),
    };
  });

  const porClasse: Record<ClasseABC, { count: number; valor: number; percentual: number }> = {
    A: { count: 0, valor: 0, percentual: 0 },
    B: { count: 0, valor: 0, percentual: 0 },
    C: { count: 0, valor: 0, percentual: 0 },
  };
  for (const p of produtos) {
    porClasse[p.classe].count += 1;
    porClasse[p.classe].valor += p.valor;
  }
  for (const classe of Object.keys(porClasse) as ClasseABC[]) {
    porClasse[classe].percentual = valorTotal > 0 ? porClasse[classe].valor / valorTotal : 0;
  }

  return { faixa, produtos, porClasse, valorTotal };
}

/**
 * Curva ABC acumulada desde 1º de janeiro do ano corrente até hoje — não é
 * mais um comparativo de período (mês atual vs. anterior): é o quadro
 * completo do ano, sempre reiniciando em janeiro.
 */
export function curvaABCAnoCorrente(itens: ItemVendido[], referencia: Date): ResumoCurvaABC {
  const inicioAno = new Date(Date.UTC(referencia.getUTCFullYear(), 0, 1));
  return resumoCurvaABC(itens, { inicio: inicioAno, fim: referencia });
}
