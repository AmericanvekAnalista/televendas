import { createClient } from "@supabase/supabase-js";
import type { Proposta, StatusProposta } from "./types";

/**
 * Persistência em uma tabela Supabase dedicada (`propostas_televendas`),
 * independente da tabela `propostas` usada pelo Plano Mestre FULL — mesmo
 * projeto Supabase, tabela própria, sem risco de interferir naquele
 * pipeline. RLS habilitado; a chave usada é a anon key (nunca exposta ao
 * navegador — só lida aqui, no servidor), com políticas restritas a esta
 * tabela específica.
 */
function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY não configurados nas variáveis de ambiente.");
  }
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

  const novasCriadas = lista.filter((p) => !numerosExistentes.has(p.numero)).length;
  const atualizadas = lista.length - novasCriadas;

  const { count, error: erroContagem } = await supabase
    .from("propostas_televendas")
    .select("*", { count: "exact", head: true });
  if (erroContagem) throw new Error(`Falha ao contar propostas no Supabase: ${erroContagem.message}`);

  return { novasCriadas, atualizadas, total: count ?? lista.length };
}
