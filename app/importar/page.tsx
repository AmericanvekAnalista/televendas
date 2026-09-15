"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { parsearCSV, analisarLinhas, type ErroImportacao } from "@/lib/import";
import { STATUS_LABEL, type StatusProposta, type Proposta } from "@/lib/types";
import { formatarMoeda, formatarNumero } from "@/lib/format";

const STATUS_OPCOES: StatusProposta[] = ["rascunho", "pendente", "aguardando", "aprovada", "concluida", "nao_aprovada"];

interface LinhasBrutas {
  cabecalho: string[];
  dados: string[][];
}

interface ResumoImportacao {
  novasCriadas: number;
  atualizadas: number;
  total: number;
}

export default function ImportarPage() {
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [brutas, setBrutas] = useState<LinhasBrutas | null>(null);
  const [statusPadrao, setStatusPadrao] = useState<StatusProposta | "">("");
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [erros, setErros] = useState<ErroImportacao[]>([]);
  const [temColunaSituacao, setTemColunaSituacao] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResumoImportacao | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reanalisar = useCallback((linhas: LinhasBrutas, status: StatusProposta | "") => {
    const r = analisarLinhas(linhas.cabecalho, linhas.dados, status || null);
    setPropostas(r.propostas);
    setErros(r.erros);
    setTemColunaSituacao(r.temColunaSituacao);
  }, []);

  async function selecionarArquivo(arquivo: File) {
    setResultado(null);
    setErroEnvio(null);
    setNomeArquivo(arquivo.name);
    const texto = await arquivo.text();
    const linhas = parsearCSV(texto);
    if (linhas.length < 2) {
      setBrutas(null);
      setErros([{ linha: 1, motivo: "Arquivo vazio ou sem linhas de dados (só o cabeçalho)." }]);
      setPropostas([]);
      return;
    }
    const [cabecalho, ...dados] = linhas;
    const novasBrutas = { cabecalho, dados };
    setBrutas(novasBrutas);
    reanalisar(novasBrutas, statusPadrao);
  }

  function mudarStatusPadrao(status: StatusProposta | "") {
    setStatusPadrao(status);
    if (brutas) reanalisar(brutas, status);
  }

  async function confirmarImportacao() {
    setEnviando(true);
    setErroEnvio(null);
    try {
      const resp = await fetch("/api/propostas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propostas }),
      });
      const corpo = await resp.json();
      if (!resp.ok) throw new Error(corpo.erro || `Erro ${resp.status}`);
      setResultado(corpo);
    } catch (e) {
      setErroEnvio(e instanceof Error ? e.message : "Erro desconhecido ao enviar.");
    } finally {
      setEnviando(false);
    }
  }

  function recomecar() {
    setBrutas(null);
    setPropostas([]);
    setErros([]);
    setResultado(null);
    setErroEnvio(null);
    setNomeArquivo("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <Link href="/" className="text-sm text-text-muted hover:text-text-primary">
          ← Voltar ao painel
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-text-primary sm:text-2xl">Importar propostas da Tiny</h1>
        <p className="mt-1 text-sm text-text-muted">
          Exporte uma aba de Propostas Comerciais da Tiny como CSV e envie aqui. Pode importar quantos arquivos quiser —
          propostas já existentes (mesmo número) são atualizadas, nunca duplicadas.
        </p>
      </div>

      {resultado ? (
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="text-lg font-medium text-text-primary">Importação concluída</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-semibold text-text-primary">{formatarNumero(resultado.novasCriadas)}</div>
              <div className="text-sm text-text-muted">novas</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-text-primary">{formatarNumero(resultado.atualizadas)}</div>
              <div className="text-sm text-text-muted">atualizadas</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-text-primary">{formatarNumero(resultado.total)}</div>
              <div className="text-sm text-text-muted">total salvo</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={recomecar}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary cursor-pointer"
            >
              Importar outro arquivo
            </button>
            <Link
              href="/"
              className="rounded-md bg-text-primary px-3 py-1.5 text-sm font-medium text-background hover:opacity-90"
            >
              Ver painel atualizado
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
            <label className="text-sm font-medium text-text-secondary" htmlFor="arquivo">
              Arquivo CSV exportado da Tiny
            </label>
            <input
              ref={inputRef}
              id="arquivo"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (arquivo) selecionarArquivo(arquivo);
              }}
              className="text-sm text-text-secondary file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text-primary file:cursor-pointer cursor-pointer"
            />
            {nomeArquivo ? <p className="text-xs text-text-muted">Arquivo: {nomeArquivo}</p> : null}

            <div className="mt-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary" htmlFor="status-padrao">
                Status padrão {temColunaSituacao ? "(o arquivo já tem uma coluna de situação; use só como reforço)" : ""}
              </label>
              <select
                id="status-padrao"
                value={statusPadrao}
                onChange={(e) => mudarStatusPadrao(e.target.value as StatusProposta | "")}
                className="w-fit rounded-md border border-border bg-background px-3 py-1.5 text-sm text-text-primary"
              >
                <option value="">Detectar pela coluna de situação do arquivo</option>
                {STATUS_OPCOES.map((s) => (
                  <option key={s} value={s}>
                    Aplicar a todas: {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {brutas ? (
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-text-secondary">
                  {formatarNumero(propostas.length)} propostas prontas para importar
                  {erros.length > 0 ? `, ${formatarNumero(erros.length)} com erro` : ""}
                </h2>
              </div>

              {propostas.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-text-muted">
                        <th className="py-1.5 pr-3 font-medium">Número</th>
                        <th className="py-1.5 pr-3 font-medium">Data</th>
                        <th className="py-1.5 pr-3 font-medium">Cliente</th>
                        <th className="py-1.5 pr-3 font-medium">Valor</th>
                        <th className="py-1.5 pr-3 font-medium">Vendedor</th>
                        <th className="py-1.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {propostas.slice(0, 10).map((p) => (
                        <tr key={p.id} className="border-b border-border/50 text-text-secondary">
                          <td className="py-1.5 pr-3">{p.numero}</td>
                          <td className="py-1.5 pr-3">{p.dataCriacao}</td>
                          <td className="py-1.5 pr-3">{p.cliente}</td>
                          <td className="py-1.5 pr-3">{formatarMoeda(p.valor)}</td>
                          <td className="py-1.5 pr-3">{p.vendedor}</td>
                          <td className="py-1.5">{STATUS_LABEL[p.status]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {propostas.length > 10 ? (
                    <p className="mt-2 text-xs text-text-muted">+ {formatarNumero(propostas.length - 10)} outras</p>
                  ) : null}
                </div>
              ) : null}

              {erros.length > 0 ? (
                <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
                  <p className="text-sm font-medium" style={{ color: "var(--delta-down)" }}>
                    Linhas com erro (não serão importadas):
                  </p>
                  <ul className="max-h-40 list-inside list-disc overflow-y-auto text-sm text-text-secondary">
                    {erros.slice(0, 30).map((e, i) => (
                      <li key={i}>
                        Linha {e.linha}: {e.motivo}
                      </li>
                    ))}
                  </ul>
                  {erros.length > 30 ? <p className="text-xs text-text-muted">+ {erros.length - 30} outros erros</p> : null}
                </div>
              ) : null}

              {erroEnvio ? (
                <p className="text-sm" style={{ color: "var(--delta-down)" }}>
                  {erroEnvio}
                </p>
              ) : null}

              <button
                type="button"
                disabled={propostas.length === 0 || enviando}
                onClick={confirmarImportacao}
                className="w-fit rounded-md bg-text-primary px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                {enviando ? "Importando…" : `Confirmar importação (${formatarNumero(propostas.length)})`}
              </button>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
