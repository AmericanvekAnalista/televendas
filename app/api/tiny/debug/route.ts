import { obterTokenValido, TINY_API_BASE } from "@/lib/tiny-oauth";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico temporário — ver se a Tiny expõe marcadores/tag de vendedora
 * de forma estruturada (listagem e/ou detalhe), em vez de só no texto livre
 * da assinatura. Remover depois.
 */
export async function GET() {
  const token = await obterTokenValido();

  const respLista = await fetch(`${TINY_API_BASE}/orcamentos?limit=5`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const lista = await respLista.json();
  const primeiroItem = lista.itens?.[0];

  let detalhe = null;
  if (primeiroItem) {
    const respDetalhe = await fetch(`${TINY_API_BASE}/orcamentos/${primeiroItem.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    detalhe = await respDetalhe.json();
  }

  return Response.json({ primeiroItemDaLista: primeiroItem, detalheCompleto: detalhe });
}
