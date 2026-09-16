import { obterTokenValido, TINY_API_BASE } from "@/lib/tiny-oauth";

export const dynamic = "force-dynamic";

/**
 * Versão inicial, só de descoberta: busca a resposta bruta da Tiny e devolve
 * sem tentar mapear pros campos de Proposta ainda. O sandbox de
 * desenvolvimento não alcança domínios da Tiny, então o formato real da
 * resposta (nomes de campo, paginação) só dá pra confirmar aqui, já
 * publicado — depois disso o mapeamento pra `mesclarESalvar` entra nesta
 * mesma rota.
 */
export async function GET() {
  let token: string;
  try {
    token = await obterTokenValido();
  } catch (e) {
    return Response.json({ erro: (e as Error).message }, { status: 400 });
  }

  // Teste temporário: endpoint de detalhe de UM orçamento específico, pra
  // ver se ele traz o nome do cliente (a listagem só devolve contato.id).
  const resposta = await fetch(`${TINY_API_BASE}/orcamentos/927909045`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const corpo = await resposta.text();

  return Response.json({ status: resposta.status, corpo: corpo.slice(0, 20000) }, { status: resposta.ok ? 200 : 502 });
}
