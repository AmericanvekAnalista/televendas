import { obterTokenValido, TINY_API_BASE } from "@/lib/tiny-oauth";
import { mesclarESalvar } from "@/lib/store";
import type { Proposta, StatusProposta } from "@/lib/types";

export const dynamic = "force-dynamic";
// Com retry + pausas entre lotes pra lidar com o rate limit da Tiny, uma
// sincronização pode legitimamente passar de 1-2 minutos no pior caso.
export const maxDuration = 180;

/**
 * A Tiny não marca quais orçamentos são de televendas (sem tag/campo pra
 * isso) — usamos o nome de quem assina a proposta (assinatura.responsavel,
 * só disponível no detalhe) como proxy, igual já fazíamos com a coluna
 * "Marcadores" na importação por CSV.
 */
const VENDEDORES_TELEVENDAS = ["ana karolina", "ivis"];

/** Só sincroniza o que pode entrar nos comparativos de período (mês atual +
 * o mês anterior até o mesmo dia), com folga. Evita varrer os milhares de
 * orçamentos antigos da empresa inteira a cada sincronização. Sobrescrevível
 * via `?janela=` (dias) pra backfill histórico manual. */
const JANELA_DIAS = 45;

/** Backfill histórico (`?janela=` grande) não cabe numa chamada só — o
 * detalhe de cada orçamento da empresa inteira (não só televendas) exige
 * uma chamada individual à Tiny. Processa no máximo isso por vez e devolve
 * `proximoOffset` pra continuar com `?offset=`. */
const LOTE_HISTORICO = 150;

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

interface ItemDetalheOrcamento {
  produto: { id: number; sku?: string | null; descricao: string };
  quantidade: number;
  valorUnitario: number;
}

interface DetalheOrcamento {
  // Qual desses dois campos carrega o nome de quem vendeu varia por empresa
  // na Tiny — a Americanvek usa "responsavel"; a Ardut usa "saudacao" (o
  // "responsavel" dela vem genérico, "Departamento de vendas"). Checamos os
  // dois pra não depender de convenção de uma conta específica.
  assinatura?: { responsavel?: string; saudacao?: string } | null;
  itens?: ItemDetalheOrcamento[];
}

interface RespostaBusca<T> {
  status: number;
  dado: T | null;
}

function dormir(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Com 5 em paralelo + pausa de 300ms entre lotes, mais da metade das
 * chamadas ainda falhava (rate limit real da Tiny, não só excesso de
 * paralelismo) — tenta de novo com espera crescente antes de desistir.
 */
async function buscarJson<T>(caminho: string, token: string, tentativas = 3, esperaBaseMs = 500): Promise<RespostaBusca<T>> {
  let ultimoStatus = 0;
  for (let tentativa = 0; tentativa < tentativas; tentativa++) {
    const resposta = await fetch(`${TINY_API_BASE}${caminho}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    ultimoStatus = resposta.status;
    if (resposta.ok) return { status: resposta.status, dado: await resposta.json() };
    if (tentativa < tentativas - 1) await dormir(esperaBaseMs * (tentativa + 1));
  }
  return { status: ultimoStatus, dado: null };
}

/**
 * Roda `concorrencia` chamadas em paralelo por vez, com uma pausa entre
 * lotes — a Tiny não documenta um rate limit, então isso é só uma
 * precaução (uma tentativa anterior, sem pausa e com 10 em paralelo,
 * derrubou silenciosamente todas as chamadas a /contatos).
 */
async function emLotes<T, R>(itens: T[], concorrencia: number, fn: (item: T) => Promise<R>, pausaMs = 300): Promise<R[]> {
  const resultado: R[] = [];
  for (let i = 0; i < itens.length; i += concorrencia) {
    const lote = itens.slice(i, i + concorrencia);
    resultado.push(...(await Promise.all(lote.map(fn))));
    if (i + concorrencia < itens.length) await dormir(pausaMs);
  }
  return resultado;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const janela = Number(url.searchParams.get("janela")) || JANELA_DIAS;
  const offset = Number(url.searchParams.get("offset")) || 0;

  let token: string;
  try {
    token = await obterTokenValido();
  } catch (e) {
    return Response.json({ erro: (e as Error).message }, { status: 400 });
  }

  const limiteData = new Date();
  limiteData.setDate(limiteData.getDate() - janela);
  const limiteDataStr = limiteData.toISOString().slice(0, 10);

  // 1. Lista paginada (mais recentes primeiro), parando assim que a página
  // só tem orçamentos mais antigos que a janela que nos interessa. Uma
  // página que falha mesmo após as tentativas não é "acabou a lista" — é
  // rate limit; reportar como erro em vez de devolver "zero encontrado"
  // (que já nos confundiu, indistinguível de uma janela genuinamente vazia).
  const todosItens: ItemLista[] = [];
  const limit = 100;
  for (let paginaOffset = 0; ; paginaOffset += limit) {
    const { status, dado: pagina } = await buscarJson<{ itens: ItemLista[]; paginacao: { total: number } }>(
      `/orcamentos?limit=${limit}&offset=${paginaOffset}`,
      token,
      5,
      800,
    );
    if (!pagina) {
      return Response.json(
        { erro: `Falha ao listar orçamentos da Tiny (rate limit provável, HTTP ${status}). Tente novamente em alguns minutos.` },
        { status: 502 },
      );
    }
    if (pagina.itens.length === 0) break;
    todosItens.push(...pagina.itens.filter((i) => i.data >= limiteDataStr));
    const maisAntigoDaPagina = pagina.itens[pagina.itens.length - 1].data;
    if (maisAntigoDaPagina < limiteDataStr || paginaOffset + limit >= pagina.paginacao.total) break;
  }

  // Corta o lote desta chamada — em janelas grandes (backfill) o resto fica
  // pra próxima chamada, com offset=proximoOffset.
  const itens = todosItens.slice(offset, offset + LOTE_HISTORICO);
  const proximoOffset = offset + LOTE_HISTORICO < todosItens.length ? offset + LOTE_HISTORICO : null;

  // 2. Detalhe de cada um — só ele tem quem assinou a proposta. Uma falha
  // aqui não é cosmética como no nome do cliente: o orçamento inteiro fica
  // de fora desta rodada (o upsert não toca nele, então o status antigo
  // persiste até uma sincronização futura conseguir). Por isso mais
  // tentativas e menos paralelismo que o padrão.
  const comDetalhe = await emLotes(
    itens,
    3,
    async (item) => ({
      item,
      resp: await buscarJson<DetalheOrcamento>(`/orcamentos/${item.id}`, token, 5, 800),
    }),
    500,
  );
  const detalhesComFalha = comDetalhe.filter((c) => c.resp.status !== 200).length;

  const candidatos = comDetalhe
    .map(({ item, resp }) => {
      const assinatura = normalizar(
        `${resp.dado?.assinatura?.responsavel ?? ""} ${resp.dado?.assinatura?.saudacao ?? ""}`,
      );
      const vendedor = VENDEDORES_TELEVENDAS.find((v) => assinatura.includes(v));
      return vendedor ? { item, vendedor, itensDetalhe: resp.dado?.itens ?? [] } : null;
    })
    .filter((c) => c !== null);

  // Um respiro antes da próxima leva de chamadas — a fase anterior (uma
  // por orçamento) já consome boa parte da cota da Tiny nessa janela.
  await dormir(3000);

  // 3. Nome do cliente — uma chamada por contato único, não por proposta.
  const contatoIds = [...new Set(candidatos.map((c) => c.item.contato.id))];
  const nomes = await emLotes(contatoIds, 5, async (id) => {
    // Mais tentativas que o padrão: essa fase, vindo logo depois da de
    // detalhes, é a que mais esbarra no limite da Tiny.
    const { status, dado } = await buscarJson<{ nome: string }>(`/contatos/${id}`, token, 5);
    return { id, status, nome: dado?.nome ?? null };
  });
  const contatosComFalha = nomes.filter((n) => n.status !== 200).length;
  const nomePorContato = new Map(nomes.map((n) => [n.id, n.nome ?? "não identificado"]));

  // 4. Monta e salva (upsert por número, igual à importação por CSV).
  const propostas: Proposta[] = [];
  for (const { item, vendedor, itensDetalhe } of candidatos) {
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
      // Itens só importam pra Curva ABC, que só olha propostas concluídas
      // (vendas de fato) — não vale a pena guardar pra rascunho/pendente/etc.
      itens:
        status === "concluida"
          ? itensDetalhe.map((i) => ({
              produtoId: i.produto.id,
              sku: i.produto.sku || null,
              descricao: i.produto.descricao,
              quantidade: Number(i.quantidade),
              valorUnitario: Number(i.valorUnitario),
            }))
          : undefined,
    });
  }

  if (propostas.length === 0) {
    return Response.json({
      ok: true,
      mensagem: "Nenhuma proposta de televendas encontrada na janela de tempo.",
      total: 0,
      totalNaJanela: todosItens.length,
      offset,
      proximoOffset,
    });
  }

  const resumo = await mesclarESalvar(propostas);
  return Response.json({
    ok: true,
    examinadas: itens.length,
    totalNaJanela: todosItens.length,
    offset,
    proximoOffset,
    encontradas: propostas.length,
    detalhesComFalha,
    contatosComFalha,
    ...resumo,
  });
}
