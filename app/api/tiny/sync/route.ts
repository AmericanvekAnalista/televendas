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
export async function GET(request: Request) {
  let token: string;
  try {
    token = await obterTokenValido();
  } catch (e) {
    return Response.json({ erro: (e as Error).message }, { status: 400 });
  }

  // Repassa a query string recebida direto pra Tiny, pra dar pra testar
  // parâmetros (paginação, expand, etc.) sem precisar mudar o código.
  const { search } = new URL(request.url);
  const resposta = await fetch(`${TINY_API_BASE}/orcamentos${search}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const corpo = await resposta.text();

  return Response.json({ status: resposta.status, corpo: corpo.slice(0, 20000) }, { status: resposta.ok ? 200 : 502 });
}
