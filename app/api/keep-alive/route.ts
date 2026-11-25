import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Só existe pra gerar uma chamada diária ao banco e evitar a pausa
 * automática por inatividade do plano gratuito da Supabase — não lê nem
 * escreve nada relevante. Chamado pelo cron em vercel.json, num horário
 * separado do /api/tiny/sync (não depende da Tiny, só do Supabase).
 */
export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return Response.json({ ok: false, erro: "Supabase não configurado." }, { status: 500 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from("propostas_televendas").select("numero").limit(1);

  if (error) return Response.json({ ok: false, erro: error.message }, { status: 502 });
  return Response.json({ ok: true });
}
