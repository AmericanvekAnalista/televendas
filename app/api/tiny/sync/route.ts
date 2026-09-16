import { obterTokenValido, TINY_API_BASE } from "@/lib/tiny-oauth";
import { mesclarESalvar } from "@/lib/store";
import type { Proposta, StatusProposta } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * A Tiny não marca quais orçamentos são de televendas (sem tag/campo pra
 * isso) — usamos o nome de quem assina a proposta (assinatura.responsavel,
 * só disponível no detalhe) como proxy, igual já fazíamos com a coluna
 * "Marcadores" na importação por CSV.
 */
const VENDEDORES_TELEVENDAS = ["ana karolina", "ivis"];

/** Só sincroniza o que pode entrar nos comparativos de período (mês atual +
 * o mês anterior até o mesmo dia), com folga. Evita varrer os milhares de
 * orçamentos antigos da empresa inteira a cada sincronização. */
const JANELA_DIAS = 45;

const MAPA_SITUACAO: Record<string, StatusProposta> = {
  rascunho: "rascunho",
  pendente: "pendente",
  aguardando: "aguardando",
  aprovado: "aprovada",
  concluido: "concluida",
  "nao aprovado": "nao_aprovada",
  modelo: "modelo",
};

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function paraStatus(situacao: string): StatusProposta | null {
  return MAPA_SITUACAO[normalizar(situacao)] ?? null;
}

/** "1.234,560" (formato da Tiny) -> 1234.56. O detalhe já vem como número. */
function paraValor(valorTotal: string | number): number {
  if (typeof valorTotal === "number") return valorTotal;
  return Number(valorTotal.replace(/\./g, "").replace(",", "."));
}

function paraDataOuNull(data: string | null | undefined): string | null {
  if (!data || data === "0000-00-00") return null;
  return data;
}

interface ItemLista {
  id: number;
  numeroProposta: string;
  situacao: string;
  data: string;
  dataProximoContato?: string | null;
  contato: { id: number };
  valorTotal: string;
}

interface DetalheOrcamento {
  assinatura?: { responsavel?: string } | null;
}

async function buscarJson<T>(caminho: string, token: string): Promise<T | null> {
  const resposta = await fetch(`${TINY_API_BASE}${caminho}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resposta.ok) return null;
  return resposta.json();
}

/** Roda até `concorrencia` chamadas em paralelo por vez, sem estourar o rate limit da Tiny. */
async function emLotes<T, R>(itens: T[], concorrencia: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const resultado: R[] = [];
  for (let i = 0; i < itens.length; i += concorrencia) {
    const lote = itens.slice(i, i + concorrencia);
    resultado.push(...(await Promise.all(lote.map(fn))));
  }
  return resultado;
}

export async function GET() {
  let token: string;
  try {
    token = await obterTokenValido();
  } catch (e) {
    return Response.json({ erro: (e as Error).message }, { status: 400 });
  }

  const limiteData = new Date();
  limiteData.setDate(limiteData.getDate() - JANELA_DIAS);
  const limiteDataStr = limiteData.toISOString().slice(0, 10);

  // 1. Lista paginada (mais recentes primeiro), parando assim que a página
  // só tem orçamentos mais antigos que a janela que nos interessa.
  const itens: ItemLista[] = [];
  const limit = 100;
  for (let offset = 0; ; offset += limit) {
    const pagina = await buscarJson<{ itens: ItemLista[]; paginacao: { total: number } }>(
      `/orcamentos?limit=${limit}&offset=${offset}`,
      token,
    );
    if (!pagina || pagina.itens.length === 0) break;
    itens.push(...pagina.itens.filter((i) => i.data >= limiteDataStr));
    const maisAntigoDaPagina = pagina.itens[pagina.itens.length - 1].data;
    if (maisAntigoDaPagina < limiteDataStr || offset + limit >= pagina.paginacao.total) break;
  }

  // 2. Detalhe de cada um — só ele tem quem assinou a proposta.
  const comDetalhe = await emLotes(itens, 10, async (item) => ({
    item,
    detalhe: await buscarJson<DetalheOrcamento>(`/orcamentos/${item.id}`, token),
  }));

  const candidatos = comDetalhe
    .map(({ item, detalhe }) => {
      const responsavel = normalizar(detalhe?.assinatura?.responsavel ?? "");
      const vendedor = VENDEDORES_TELEVENDAS.find((v) => responsavel.includes(v));
      return vendedor ? { item, vendedor } : null;
    })
    .filter((c) => c !== null);

  // 3. Nome do cliente — uma chamada por contato único, não por proposta.
  const contatoIds = [...new Set(candidatos.map((c) => c.item.contato.id))];
  const nomes = await emLotes(contatoIds, 10, async (id) => ({
    id,
    nome: (await buscarJson<{ nome: string }>(`/contatos/${id}`, token))?.nome ?? "não identificado",
  }));
  const nomePorContato = new Map(nomes.map((n) => [n.id, n.nome]));

  // 4. Monta e salva (upsert por número, igual à importação por CSV).
  const propostas: Proposta[] = [];
  for (const { item, vendedor } of candidatos) {
    const status = paraStatus(item.situacao);
    if (!status) continue;
    propostas.push({
      id: `tiny-${item.id}`,
      numero: Number(item.numeroProposta),
      dataCriacao: item.data,
      proximoContato: paraDataOuNull(item.dataProximoContato),
      cliente: nomePorContato.get(item.contato.id) ?? "não identificado",
      valor: paraValor(item.valorTotal),
      vendedor,
      status,
      integrada: status === "concluida",
    });
  }

  if (propostas.length === 0) {
    return Response.json({ ok: true, mensagem: "Nenhuma proposta de televendas encontrada na janela de tempo.", total: 0 });
  }

  const resumo = await mesclarESalvar(propostas);
  return Response.json({ ok: true, examinadas: itens.length, encontradas: propostas.length, ...resumo });
}
