import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico temporário — conferir, linha a linha, se o que está salvo
 * bate com o que aparece na Tiny (comparação manual pedida pelo usuário).
 * Remover depois.
 */
export async function GET() {
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
