import { createClient } from "@supabase/supabase-js";
import { obterTokenValido, TINY_API_BASE } from "@/lib/tiny-oauth";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

function dormir(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function buscarComRetry(caminho: string, token: string, tentativas = 5, esperaBaseMs = 800): Promise<Response> {
  let ultima: Response | null = null;
  for (let t = 0; t < tentativas; t++) {
    const r = await fetch(`${TINY_API_BASE}${caminho}`, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) return r;
    ultima = r;
    if (t < tentativas - 1) await dormir(esperaBaseMs * (t + 1));
  }
  return ultima!;
}

/**
 * Diagnóstico temporário — comparar direto com a Tiny (filtrando por
 * situacao=Concluído + dataInicio/dataFim no servidor, sem depender da
 * nossa janela de sincronização) o que ela tem de novembro vs. o que está
 * no nosso banco, pra achar propostas (ex: da Ivis) que caíram fora da
 * janela de dias antes de serem concluídas. Busca os detalhes em série
 * (não em paralelo) pra não bater rate limit. Remover depois.
 */
export async function GET() {
  const token = await obterTokenValido();

  const resp = await buscarComRetry(
    `/orcamentos?situacao=Concluído&dataInicio=2026-11-01&dataFim=2026-11-24&limit=100`,
    token,
  );
  if (!resp.ok) {
    return Response.json({ erro: `Tiny respondeu ${resp.status}`, corpo: await resp.text() }, { status: 502 });
  }
  const pagina = (await resp.json()) as {
    itens: { id: number; numeroProposta: string; situacao: string; data: string; contato: { id: number }; valorTotal: string }[];
    paginacao: { total: number };
  };

  const detalhes = [];
  for (const item of pagina.itens) {
    const r = await buscarComRetry(`/orcamentos/${item.id}`, token);
    if (!r.ok) {
      detalhes.push({ numero: item.numeroProposta, erro: `detalhe ${r.status}` });
    } else {
      const d = (await r.json()) as { assinatura?: { responsavel?: string; saudacao?: string } | null; vendedor?: { id: number } | null };
      detalhes.push({
        numero: item.numeroProposta,
        data: item.data,
        valor: item.valorTotal,
        vendedorId: d.vendedor?.id ?? null,
        assinaturaResponsavel: d.assinatura?.responsavel ?? null,
        assinaturaSaudacao: d.assinatura?.saudacao ?? null,
      });
    }
    await dormir(400);
  }

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
