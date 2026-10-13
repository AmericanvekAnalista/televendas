import { createClient } from "@supabase/supabase-js";
import { obterTokenValido, TINY_API_BASE } from "@/lib/tiny-oauth";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico temporário — conferir, linha a linha, se o que está salvo
 * bate com o que aparece na Tiny (comparação manual pedida pelo usuário).
 * `?numero=` investiga por que um cliente específico ficou "não identificado".
 * Remover depois.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const numeroInvestigar = url.searchParams.get("numero");

  if (numeroInvestigar) {
    const token = await obterTokenValido();
    const limiteData = new Date();
    limiteData.setDate(limiteData.getDate() - 45);
    const limiteDataStr = limiteData.toISOString().slice(0, 10);

    let contatoId: number | null = null;
    let itemEncontrado: unknown = null;
    for (let offset = 0; ; offset += 100) {
      const resp = await fetch(`${TINY_API_BASE}/orcamentos?limit=100&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pagina = await resp.json();
      const item = pagina.itens?.find((i: { numeroProposta: string }) => i.numeroProposta === numeroInvestigar);
      if (item) {
        contatoId = item.contato.id;
        itemEncontrado = item;
        break;
      }
      if (!pagina.itens?.length || pagina.itens[pagina.itens.length - 1].data < limiteDataStr) break;
      if (offset + 100 >= pagina.paginacao.total) break;
    }

    if (!contatoId) return Response.json({ erro: `Proposta ${numeroInvestigar} não encontrada na janela.` });

    const respContato = await fetch(`${TINY_API_BASE}/contatos/${contatoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const dadoContato = await respContato.json();

    return Response.json({ itemEncontrado, contatoId, statusContato: respContato.status, dadoContato });
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("propostas_televendas")
    .select("numero, data_criacao, cliente, valor, vendedor, status, integrada")
    .gte("data_criacao", "2026-10-01")
    .order("numero");

  if (error) return Response.json({ erro: error.message }, { status: 500 });
  return Response.json({ total: data.length, propostas: data });
}
