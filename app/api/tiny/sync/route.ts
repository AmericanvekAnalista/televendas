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

  const resposta = await fetch(`${TINY_API_BASE}/orcamentos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const corpo = await resposta.text();

  return Response.json({ status: resposta.status, corpo: corpo.slice(0, 5000) }, { status: resposta.ok ? 200 : 502 });
}
