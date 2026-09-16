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

  // Teste temporário: contato (nome do cliente) e vendedores (pra achar os
  // IDs de ana karolina / ivis e conseguir filtrar só as propostas de
  // televendas dentre todos os orçamentos da empresa).
  const [contato, vendedores] = await Promise.all([
    fetch(`${TINY_API_BASE}/contatos/787470942`, { headers: { Authorization: `Bearer ${token}` } }).then((r) =>
      r.text().then((t) => ({ status: r.status, corpo: t.slice(0, 3000) })),
    ),
    fetch(`${TINY_API_BASE}/vendedores`, { headers: { Authorization: `Bearer ${token}` } }).then((r) =>
      r.text().then((t) => ({ status: r.status, corpo: t.slice(0, 8000) })),
    ),
  ]);

  return Response.json({ contato, vendedores });
}
