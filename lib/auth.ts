export const NOME_COOKIE = "dash_sessao";

function hexDigest(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(texto: string): Promise<string> {
  const dados = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest("SHA-256", dados);
  return hexDigest(hash);
}

/** Sem DASH_USUARIO/DASH_SENHA configurados, o login fica desativado e o
 * dashboard continua público — evita travar um deployment que ainda não
 * configurou essas variáveis. */
export function loginConfigurado(): boolean {
  return Boolean(process.env.DASH_USUARIO && process.env.DASH_SENHA);
}

export function credenciaisValidas(usuario: string, senha: string): boolean {
  return usuario === process.env.DASH_USUARIO && senha === process.env.DASH_SENHA;
}

/** Token de sessão: um hash derivado da própria senha, nunca a senha em si
 * — assim o cookie não carrega o segredo em texto puro. */
export function tokenSessaoValido(): Promise<string> {
  return sha256(`${process.env.DASH_USUARIO}:${process.env.DASH_SENHA}`);
}
