"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function FormularioLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, senha }),
      });
      if (!resp.ok) {
        const corpo = await resp.json().catch(() => null);
        throw new Error(corpo?.erro || "Não foi possível entrar.");
      }
      router.replace(searchParams.get("next") || "/");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-6">
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Entrar</h1>
          <p className="mt-1 text-sm text-text-muted">Acesso restrito ao painel de televendas.</p>
        </div>

        <form onSubmit={entrar} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary" htmlFor="usuario">
              Usuário
            </label>
            <input
              id="usuario"
              type="text"
              autoFocus
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-text-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-text-primary"
            />
          </div>

          {erro ? (
            <p className="text-sm" style={{ color: "var(--delta-down)" }}>
              {erro}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={enviando || !usuario || !senha}
            className="mt-1 rounded-md bg-text-primary px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <FormularioLogin />
    </Suspense>
  );
}
