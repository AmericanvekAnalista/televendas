import { createClient } from "@supabase/supabase-js";

/**
 * Integração OAuth2 com a Tiny (API v3). Usa a service_role key do Supabase
 * (não a anon key) porque a tabela de tokens não tem policy de RLS pra
 * anon/authenticated — o token dá acesso de leitura ao ERP ao vivo, então
 * fica isolado do restante do app, que usa a anon key normalmente.
 */
const AUTHORIZE_URL = "https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/auth";
const TOKEN_URL = "https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token";
export const TINY_API_BASE = "https://erp.tiny.com.br/public-api/v3";

function getServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados nas variáveis de ambiente.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function credenciaisClient(): { clientId: string; clientSecret: string } {
  const clientId = process.env.TINY_CLIENT_ID;
  const clientSecret = process.env.TINY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("TINY_CLIENT_ID / TINY_CLIENT_SECRET não configurados nas variáveis de ambiente.");
  }
  return { clientId, clientSecret };
}

export function montarUrlAutorizacao(redirectUri: string, state: string): string {
  const { clientId } = credenciaisClient();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

interface RespostaToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

async function chamarTokenEndpoint(body: URLSearchParams): Promise<RespostaToken> {
  const resposta = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!resposta.ok) {
    const texto = await resposta.text();
    throw new Error(`Falha ao obter token da Tiny (HTTP ${resposta.status}): ${texto}`);
  }
  return resposta.json();
}

async function salvarToken(token: RespostaToken): Promise<void> {
  const supabase = getServiceClient();
  const expiraEm = new Date(Date.now() + token.expires_in * 1000).toISOString();
  const { error } = await supabase.from("tiny_oauth_tokens").upsert(
    {
      id: 1,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: expiraEm,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(`Falha ao salvar token da Tiny no Supabase: ${error.message}`);
}

export async function trocarCodigoPorToken(code: string, redirectUri: string): Promise<void> {
  const { clientId, clientSecret } = credenciaisClient();
  const token = await chamarTokenEndpoint(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  );
  await salvarToken(token);
}

const MARGEM_EXPIRACAO_MS = 60_000;

/** Retorna um access_token válido, renovando via refresh_token se necessário. */
export async function obterTokenValido(): Promise<string> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("tiny_oauth_tokens").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(`Falha ao ler token da Tiny no Supabase: ${error.message}`);
  if (!data) {
    throw new Error("Integração com a Tiny ainda não autorizada. Acesse /api/tiny/authorize para conectar.");
  }

  const expiraEm = new Date(data.expires_at).getTime();
  if (Date.now() < expiraEm - MARGEM_EXPIRACAO_MS) {
    return data.access_token as string;
  }

  const { clientId, clientSecret } = credenciaisClient();
  const token = await chamarTokenEndpoint(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: data.refresh_token as string,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  );
  await salvarToken(token);
  return token.access_token;
}
