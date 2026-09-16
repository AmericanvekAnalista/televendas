import { createClient } from "@supabase/supabase-js";
import type { ItemProduto, Proposta, StatusProposta } from "./types";

/**
 * Persistência em uma tabela Supabase dedicada (`propostas_televendas`),
 * independente da tabela `propostas` usada pelo Plano Mestre FULL — mesmo
 * projeto Supabase, tabela própria, sem risco de interferir naquele
 * pipeline. RLS habilitado; a chave usada é a anon key (nunca exposta ao
 * navegador — só lida aqui, no servidor), com políticas restritas a esta
 * tabela específica.
 */
/**
 * O cliente HTTP usa os valores como cabeçalhos, que só aceitam caracteres
 * Latin-1 (código ≤ 255). Se a variável foi colada errado na Vercel (ex: de
 * um campo mascarado, ou incluindo texto ao redor como um marcador de lista),
 * o erro de baixo nível não diz qual variável nem onde — então validamos
 * aqui para apontar exatamente o caractere e a posição culpados.
 */
function validarCabecalho(nome: string, valor: string): void {
  for (let i = 0; i < valor.length; i++) {
    const codigo = valor.charCodeAt(i);
    if (codigo > 255) {
      const antes = valor.slice(Math.max(0, i - 6), i);
      const depois = valor.slice(i + 1, i + 7);
      throw new Error(
        `Variável ${nome} tem um caractere inválido na posição ${i} de ${valor.length} ` +
          `(código ${codigo}, "${valor[i]}"). Contexto: "...${antes}[AQUI]${depois}...". ` +
          `Provavelmente foi colada errado — apague e recadastre essa variável na Vercel.`,
      );
    }
  }
}

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY não configurados nas variáveis de ambiente.");
  }
  validarCabecalho("SUPABASE_URL", url);
  validarCabecalho("SUPABASE_ANON_KEY", key);
  return createClient(url, key, { auth: { persistSession: false } });
}

interface LinhaTabela {
  numero: number;
  data_criacao: string;
  proximo_contato: string | null;
  cliente: string;
  valor: number | string;
  vendedor: string;
  status: StatusProposta;
  integrada: boolean;
}

function paraProposta(linha: LinhaTabela): Proposta {
  return {
    id: `sb-${linha.numero}`,
    numero: linha.numero,
    dataCriacao: linha.data_criacao,
    proximoContato: linha.proximo_contato,
    cliente: linha.cliente,
    valor: Number(linha.valor),
    vendedor: linha.vendedor,
    status: linha.status,
    integrada: linha.integrada,
  };
}

export async function lerPropostasSalvas(): Promise<Proposta[]> {
  const supabase = getClient();
  const { data, error } = await supabase.from("propostas_televendas").select("*").order("numero");
  if (error) throw new Error(`Falha ao ler propostas do Supabase: ${error.message}`);
  return (data ?? []).map(paraProposta);
}

/** Item de proposta concluída, com a data da proposta pai já embutida
 * (denormalizada na tabela) — base da Curva ABC. */
export interface ItemVendido {
  numeroProposta: number;
  produtoId: number;
  sku: string | null;
  descricao: string;
  quantidade: number;
  valorTotal: number;
  dataCriacao: string;
}

interface LinhaItem {
  numero_proposta: number;
  produto_id: number;
  sku: string | null;
  descricao: string;
  quantidade: number | string;
  valor_total: number | string;
  data_criacao: string;
}

export async function lerItensVendidos(): Promise<ItemVendido[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("propostas_televendas_itens")
    .select("numero_proposta, produto_id, sku, descricao, quantidade, valor_total, data_criacao");
  if (error) throw new Error(`Falha ao ler itens de produtos do Supabase: ${error.message}`);
  return (data ?? []).map((linha: LinhaItem) => ({
    numeroProposta: linha.numero_proposta,
    produtoId: linha.produto_id,
    sku: linha.sku,
    descricao: linha.descricao,
    quantidade: Number(linha.quantidade),
    valorTotal: Number(linha.valor_total),
    dataCriacao: linha.data_criacao,
  }));
}

export interface ResumoMesclagem {
  novasCriadas: number;
  atualizadas: number;
  total: number;
}

/** Faz upsert por `numero` — nunca perde propostas de importações anteriores. */
export async function mesclarESalvar(novas: Proposta[]): Promise<ResumoMesclagem> {
  const supabase = getClient();

  // Dedup dentro do próprio lote (Postgres rejeita upsert com a mesma chave
  // de conflito duas vezes numa única instrução) — a última ocorrência vence.
  const porNumero = new Map(novas.map((p) => [p.numero, p]));
  const lista = Array.from(porNumero.values());
  const numeros = lista.map((p) => p.numero);

  const { data: existentes, error: erroLeitura } = await supabase
    .from("propostas_televendas")
    .select("numero")
    .in("numero", numeros);
  if (erroLeitura) throw new Error(`Falha ao verificar propostas existentes: ${erroLeitura.message}`);
  const numerosExistentes = new Set((existentes ?? []).map((r) => r.numero as number));

  const linhas: LinhaTabela[] = lista.map((p) => ({
    numero: p.numero,
    data_criacao: p.dataCriacao,
    proximo_contato: p.proximoContato,
    cliente: p.cliente,
    valor: p.valor,
    vendedor: p.vendedor,
    status: p.status,
    integrada: p.integrada,
  }));

  const { error: erroUpsert } = await supabase
    .from("propostas_televendas")
    .upsert(linhas.map((l) => ({ ...l, atualizado_em: new Date().toISOString() })), { onConflict: "numero" });
  if (erroUpsert) throw new Error(`Falha ao salvar propostas no Supabase: ${erroUpsert.message}`);

  // Itens/produtos — só vêm da sincronização com a Tiny (base da Curva ABC).
  const linhasItens = lista.flatMap((p) =>
    (p.itens ?? []).map((item: ItemProduto) => ({
      numero_proposta: p.numero,
      data_criacao: p.dataCriacao,
      produto_id: item.produtoId,
      sku: item.sku,
      descricao: item.descricao,
      quantidade: item.quantidade,
      valor_unitario: item.valorUnitario,
      valor_total: item.quantidade * item.valorUnitario,
      atualizado_em: new Date().toISOString(),
    })),
  );
  if (linhasItens.length > 0) {
    const { error: erroItens } = await supabase
      .from("propostas_televendas_itens")
      .upsert(linhasItens, { onConflict: "numero_proposta,produto_id" });
    if (erroItens) throw new Error(`Falha ao salvar itens de produtos no Supabase: ${erroItens.message}`);
  }

  const novasCriadas = lista.filter((p) => !numerosExistentes.has(p.numero)).length;
  const atualizadas = lista.length - novasCriadas;

  const { count, error: erroContagem } = await supabase
    .from("propostas_televendas")
    .select("*", { count: "exact", head: true });
  if (erroContagem) throw new Error(`Falha ao contar propostas no Supabase: ${erroContagem.message}`);

  return { novasCriadas, atualizadas, total: count ?? lista.length };
}
