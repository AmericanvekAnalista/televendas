import { promises as fs } from "fs";
import path from "path";
import type { Proposta } from "./types";

const CAMINHO_ARQUIVO = path.join(process.cwd(), "data", "propostas.json");

export async function lerPropostasSalvas(): Promise<Proposta[]> {
  try {
    const conteudo = await fs.readFile(CAMINHO_ARQUIVO, "utf-8");
    const dados = JSON.parse(conteudo);
    return Array.isArray(dados) ? dados : [];
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw erro;
  }
}

export interface ResumoMesclagem {
  novasCriadas: number;
  atualizadas: number;
  total: number;
}

/** Faz upsert por `numero` — nunca perde propostas de importações anteriores. */
export async function mesclarESalvar(novas: Proposta[]): Promise<ResumoMesclagem> {
  const existentes = await lerPropostasSalvas();
  const porNumero = new Map(existentes.map((p) => [p.numero, p]));

  let novasCriadas = 0;
  let atualizadas = 0;
  for (const p of novas) {
    if (porNumero.has(p.numero)) atualizadas++;
    else novasCriadas++;
    porNumero.set(p.numero, p);
  }

  const resultado = Array.from(porNumero.values()).sort((a, b) => a.numero - b.numero);
  await fs.mkdir(path.dirname(CAMINHO_ARQUIVO), { recursive: true });
  await fs.writeFile(CAMINHO_ARQUIVO, JSON.stringify(resultado, null, 2), "utf-8");

  return { novasCriadas, atualizadas, total: resultado.length };
}
