import { createClient } from "@supabase/supabase-js";
import { obterTokenValido, TINY_API_BASE } from "@/lib/tiny-oauth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Diagnóstico temporário — comparar direto com a Tiny (filtrando por
 * situacao=Concluído + dataInicio/dataFim no servidor, sem depender da
 * nossa janela de sincronização) o que ela tem de novembro vs. o que está
 * no nosso banco, pra achar propostas (ex: da Ivis) que caíram fora da
 * janela de dias antes de serem concluídas. Remover depois.
 */
export async function GET() {
  const token = await obterTokenValido();

  const resp = await fetch(
    `${TINY_API_BASE}/orcamentos?situacao=Concluído&dataInicio=2026-11-01&dataFim=2026-11-24&limit=100`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!resp.ok) {
    return Response.json({ erro: `Tiny respondeu ${resp.status}`, corpo: await resp.text() }, { status: 502 });
  }
  const pagina = (await resp.json()) as {
    itens: { id: number; numeroProposta: string; situacao: string; data: string; contato: { id: number }; valorTotal: string }[];
    paginacao: { total: number };
  };

  const detalhes = await Promise.all(
    pagina.itens.map(async (item) => {
      const r = await fetch(`${TINY_API_BASE}/orcamentos/${item.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) return { numero: item.numeroProposta, erro: `detalhe ${r.status}` };
      const d = (await r.json()) as { assinatura?: { responsavel?: string; saudacao?: string } | null; vendedor?: { id: number } | null };
      return {
        numero: item.numeroProposta,
        data: item.data,
        valor: item.valorTotal,
        vendedorId: d.vendedor?.id ?? null,
        assinaturaResponsavel: d.assinatura?.responsavel ?? null,
        assinaturaSaudacao: d.assinatura?.saudacao ?? null,
      };
    }),
  );

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data: noBanco, error } = await supabase
    .from("propostas_televendas")
    .select("numero, data_criacao, cliente, valor, vendedor, status")
    .gte("data_criacao", "2026-11-01");
  if (error) return Response.json({ erro: error.message }, { status: 500 });

  const numerosNoBanco = new Set((noBanco ?? []).map((r) => String(r.numero)));
  const faltandoNoBanco = detalhes.filter((d) => !numerosNoBanco.has(d.numero));

  return Response.json({
    totalConcluidoNaTiny: pagina.paginacao.total,
    totalNoBanco: noBanco?.length ?? 0,
    faltandoNoBanco,
    detalheTiny: detalhes,
    noBanco,
  });
}
