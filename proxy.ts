import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { NOME_COOKIE, loginConfigurado, tokenSessaoValido } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  if (!loginConfigurado()) return NextResponse.next();

  const cookie = request.cookies.get(NOME_COOKIE)?.value;
  if (cookie && cookie === (await tokenSessaoValido())) return NextResponse.next();

  const url = new URL("/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api/tiny|api/auth|login|_next/static|_next/image|favicon.ico).*)"],
};
