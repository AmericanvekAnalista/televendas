import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico temporário — os dois dashboards pararam de ler do Supabase com
 * "TypeError: fetch failed" (erro genérico de rede, sem causa exposta pelo
 * supabase-js). Testa a conectividade diretamente e expõe a causa real.
 * Remover depois de identificar o problema.
 */
export async function GET() {
  const url = process.env.SUPABASE_URL ?? null;
  const resultado: Record<string, unknown> = {
    supabaseUrlHost: url ? new URL(url).host : null,
    supabaseUrlConfigurada: Boolean(url),
    anonKeyConfigurada: Boolean(process.env.SUPABASE_ANON_KEY),
    serviceRoleConfigurada: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };

  if (url) {
    try {
      const resp = await fetch(url, { method: "GET" });
      resultado.fetchDiretoStatus = resp.status;
    } catch (e) {
      const err = e as Error & { cause?: unknown };
      resultado.fetchDiretoErro = {
        message: err.message,
        cause: err.cause ? String(err.cause) : null,
        causeCode: (err.cause as { code?: string } | undefined)?.code ?? null,
      };
    }
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { error } = await supabase.from("propostas_televendas").select("numero").limit(1);
    resultado.supabaseClientErro = error ? { message: error.message, code: error.code, details: error.details } : null;
  } catch (e) {
    const err = e as Error & { cause?: unknown };
    resultado.supabaseClientExcecao = { message: err.message, cause: err.cause ? String(err.cause) : null };
  }

  return Response.json(resultado);
}
