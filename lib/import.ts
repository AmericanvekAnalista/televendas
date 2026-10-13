import type { Proposta, StatusProposta } from "./types";

export interface ErroImportacao {
  /** Linha do arquivo (1 = cabeçalho, 2 = primeira linha de dados). */
  linha: number;
  motivo: string;
}

export interface ResultadoAnalise {
  propostas: Proposta[];
  erros: ErroImportacao[];
  temColunaSituacao: boolean;
}

type CampoConhecido = "numero" | "data" | "proximoContato" | "cliente" | "valor" | "vendedor" | "marcadores" | "situacao";

const TAGS_IGNORADAS = ["televendas"];

/**
 * Parser de CSV simples (RFC 4180): aspas duplas, campos com vírgula/ponto e
 * vírgula/quebra de linha dentro de aspas, escape de aspas duplicado (""),
 * \r\n ou \n. Detecta automaticamente o delimitador (`,` ou `;` — o Excel em
 * português exporta CSV com `;`, já que a vírgula é o separador decimal).
 */
export function parsearCSV(texto: string): string[][] {
  const semBOM = texto.replace(/^﻿/, "");
  const delimitador = escolherDelimitador(semBOM);

  const linhas: string[][] = [];
  let campo = "";
  let linhaAtual: string[] = [];
  let dentroDeAspas = false;

  for (let i = 0; i < semBOM.length; i++) {
    const c = semBOM[i];
    const proximo = semBOM[i + 1];

    if (dentroDeAspas) {
      if (c === '"' && proximo === '"') {
        campo += '"';
        i++;
      } else if (c === '"') {
        dentroDeAspas = false;
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') {
      dentroDeAspas = true;
    } else if (c === delimitador) {
      linhaAtual.push(campo);
      campo = "";
    } else if (c === "\r") {
      // ignora — o \n seguinte fecha a linha
    } else if (c === "\n") {
      linhaAtual.push(campo);
      linhas.push(linhaAtual);
      linhaAtual = [];
      campo = "";
    } else {
      campo += c;
    }
  }
  if (campo.length > 0 || linhaAtual.length > 0) {
    linhaAtual.push(campo);
    linhas.push(linhaAtual);
  }

  return linhas.filter((l) => l.some((c) => c.trim() !== ""));
}

function escolherDelimitador(texto: string): "," | ";" {
  const primeiraLinha = texto.split(/\r?\n/, 1)[0] ?? "";
  const virgulas = (primeiraLinha.match(/,/g) ?? []).length;
  const pontoEVirgulas = (primeiraLinha.match(/;/g) ?? []).length;
  return pontoEVirgulas > virgulas ? ";" : ",";
}

function normalizarTexto(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function mapearCabecalhos(cabecalhos: string[]): Partial<Record<CampoConhecido, number>> {
  const normalizados = cabecalhos.map(normalizarTexto);
  const mapa: Partial<Record<CampoConhecido, number>> = {};

  const candidatos: Array<[CampoConhecido, string[]]> = [
    ["numero", ["numero", "n", "no", "num", "n da proposta", "numero da proposta"]],
    ["data", ["data", "data de criacao", "data criacao"]],
    ["proximoContato", ["prox contato", "proximo contato", "data proximo contato"]],
    ["cliente", ["cliente", "nome do cliente"]],
    ["valor", ["valor", "valor total", "valor da proposta", "total"]],
    ["vendedor", ["vendedor", "responsavel", "vendedora"]],
    ["marcadores", ["marcadores", "marcador", "tags", "etiquetas"]],
    ["situacao", ["situacao", "status"]],
  ];

  for (const [campo, opcoes] of candidatos) {
    const idx = normalizados.findIndex((h) => opcoes.includes(h));
    if (idx !== -1) mapa[campo] = idx;
  }
  return mapa;
}

export function parsearValorMonetario(bruto: string): number | null {
  const limpo = bruto.replace(/[R$\s]/gi, "").trim();
  if (!limpo) return null;

  let normalizado: string;
  if (limpo.includes(",")) {
    normalizado = limpo.replace(/\./g, "").replace(",", ".");
  } else {
    normalizado = limpo;
  }

  const valor = Number.parseFloat(normalizado);
  return Number.isFinite(valor) ? valor : null;
}

export function parsearData(bruto: string): string | null {
  const limpo = bruto.trim();
  const isoMatch = limpo.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const brMatch = limpo.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    const [, dia, mes, ano] = brMatch;
    return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }

  return null;
}

export function extrairVendedor(bruto: string): string {
  const partes = bruto
    .split(/[,;|\n]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !TAGS_IGNORADAS.includes(normalizarTexto(p)));

  return partes[0] ?? "não identificado";
}

const STATUS_POR_ROTULO: Record<string, StatusProposta> = {
  rascunho: "rascunho",
  rascunhos: "rascunho",
  pendente: "pendente",
  pendentes: "pendente",
  aguardando: "aguardando",
  aprovada: "aprovada",
  aprovadas: "aprovada",
  concluida: "concluida",
  concluidas: "concluida",
  concluido: "concluida",
  concluidos: "concluida",
  "nao aprovada": "nao_aprovada",
  "nao aprovadas": "nao_aprovada",
  reprovada: "nao_aprovada",
  reprovadas: "nao_aprovada",
  recusada: "nao_aprovada",
  recusadas: "nao_aprovada",
  perdida: "nao_aprovada",
  perdidas: "nao_aprovada",
  modelo: "modelo",
  modelos: "modelo",
};

export function mapearStatus(bruto: string): StatusProposta | null {
  return STATUS_POR_ROTULO[normalizarTexto(bruto)] ?? null;
}

export function analisarLinhas(
  cabecalhos: string[],
  linhasDeDados: string[][],
  statusPadrao: StatusProposta | null
): ResultadoAnalise {
  const colunas = mapearCabecalhos(cabecalhos);
  const erros: ErroImportacao[] = [];

  if (colunas.numero === undefined || colunas.data === undefined || colunas.cliente === undefined || colunas.valor === undefined) {
    return {
      propostas: [],
      erros: [
        {
          linha: 1,
          motivo:
            "Não encontrei as colunas obrigatórias (Número, Data, Cliente, Valor) no cabeçalho. Confira se a primeira linha do arquivo é o cabeçalho.",
        },
      ],
      temColunaSituacao: colunas.situacao !== undefined,
    };
  }

  const propostas: Proposta[] = [];

  linhasDeDados.forEach((linha, i) => {
    const numeroLinha = i + 2; // 1 = cabeçalho
    const pegar = (idx: number | undefined) => (idx !== undefined ? (linha[idx] ?? "").trim() : "");

    const numeroBruto = pegar(colunas.numero);
    const numero = Number.parseInt(numeroBruto.replace(/\D/g, ""), 10);
    if (!Number.isFinite(numero) || numero <= 0) {
      erros.push({ linha: numeroLinha, motivo: `Número de proposta inválido: "${numeroBruto}"` });
      return;
    }

    const dataCriacao = parsearData(pegar(colunas.data));
    if (!dataCriacao) {
      erros.push({ linha: numeroLinha, motivo: `Data inválida: "${pegar(colunas.data)}" (esperado dd/mm/aaaa)` });
      return;
    }

    const cliente = pegar(colunas.cliente);
    if (!cliente) {
      erros.push({ linha: numeroLinha, motivo: "Cliente em branco" });
      return;
    }

    const valor = parsearValorMonetario(pegar(colunas.valor));
    if (valor === null) {
      erros.push({ linha: numeroLinha, motivo: `Valor inválido: "${pegar(colunas.valor)}"` });
      return;
    }

    let status: StatusProposta | null = null;
    if (colunas.situacao !== undefined) {
      status = mapearStatus(pegar(colunas.situacao));
    }
    if (status === null) status = statusPadrao;
    if (status === null) {
      erros.push({
        linha: numeroLinha,
        motivo: `Situação "${pegar(colunas.situacao)}" não reconhecida e nenhum status padrão foi selecionado`,
      });
      return;
    }

    const vendedor = colunas.vendedor !== undefined ? pegar(colunas.vendedor) : extrairVendedor(pegar(colunas.marcadores));
    const proximoContato = colunas.proximoContato !== undefined ? parsearData(pegar(colunas.proximoContato)) : null;

    propostas.push({
      id: `imp-${numero}`,
      numero,
      dataCriacao,
      proximoContato,
      cliente,
      valor,
      vendedor: vendedor || "não identificado",
      status,
      integrada: status === "concluida",
    });
  });

  return { propostas, erros, temColunaSituacao: colunas.situacao !== undefined };
}
