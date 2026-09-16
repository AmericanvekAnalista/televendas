import { cookies } from "next/headers";
import { montarUrlAutorizacao } from "@/lib/tiny-oauth";

export const dynamic = "force-dynamic";

/**
 * Ponto de entrada da autorização: visite esta rota uma vez, logado na Tiny,
 * pra aprovar o acesso e gerar o primeiro refresh_token. Depois disso a
 * renovação é automática (ver lib/tiny-oauth.ts).
 */
export async function GET(request: Request) {
  const state = crypto.randomUUID();
  const redirectUri = new URL("/api/tiny/callback", request.url).toString();

  const jar = await cookies();
  jar.set("tiny_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return Response.redirect(montarUrlAutorizacao(redirectUri, state));
}
