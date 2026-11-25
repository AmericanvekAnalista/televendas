import { NextResponse } from "next/server";
import { NOME_COOKIE, credenciaisValidas, loginConfigurado, tokenSessaoValido } from "@/lib/auth";

export async function POST(request: Request) {
  if (!loginConfigurado()) {
    return NextResponse.json({ erro: "Login não configurado nesse deployment." }, { status: 503 });
  }

  const corpo = await request.json().catch(() => null);
  const usuario = corpo?.usuario;
  const senha = corpo?.senha;
  if (typeof usuario !== "string" || typeof senha !== "string" || !credenciaisValidas(usuario, senha)) {
    return NextResponse.json({ erro: "Usuário ou senha inválidos." }, { status: 401 });
  }

  const resposta = NextResponse.json({ ok: true });
  resposta.cookies.set(NOME_COOKIE, await tokenSessaoValido(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return resposta;
}
