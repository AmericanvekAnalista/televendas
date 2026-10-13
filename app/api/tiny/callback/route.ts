import { cookies } from "next/headers";
import { trocarCodigoPorToken } from "@/lib/tiny-oauth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const erro = url.searchParams.get("error");

  if (erro) {
    return Response.json({ erro: `Tiny recusou a autorização: ${erro}` }, { status: 400 });
  }
  if (!code || !state) {
    return Response.json({ erro: "Faltou 'code' ou 'state' no retorno da Tiny." }, { status: 400 });
  }

  const jar = await cookies();
  const stateEsperado = jar.get("tiny_oauth_state")?.value;
  jar.delete("tiny_oauth_state");
  if (!stateEsperado || stateEsperado !== state) {
    return Response.json({ erro: "State inválido ou expirado — inicie a autorização de novo em /api/tiny/authorize." }, { status: 400 });
  }

  const redirectUri = new URL("/api/tiny/callback", request.url).toString();
  try {
    await trocarCodigoPorToken(code, redirectUri);
  } catch (e) {
    return Response.json({ erro: `Falha ao trocar o código por um token: ${(e as Error).message}` }, { status: 500 });
  }

  return Response.json({ ok: true, mensagem: "Tiny conectada com sucesso. Pode chamar /api/tiny/sync pra importar as propostas." });
}
