import { lerPropostasSalvas, mesclarESalvar } from "@/lib/store";
import { ESTAGIOS_FUNIL, type Proposta, type StatusProposta } from "@/lib/types";

const STATUS_VALIDOS = new Set<StatusProposta>(["rascunho", "pendente", "aguardando", "aprovada", "concluida", "nao_aprovada", "modelo"]);

function ehPropostaValida(v: unknown): v is Proposta {
  if (typeof v !== "object" || v === null) return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p.numero === "number" &&
    typeof p.dataCriacao === "string" &&
    typeof p.cliente === "string" &&
    typeof p.valor === "number" &&
    typeof p.vendedor === "string" &&
    typeof p.status === "string" &&
    STATUS_VALIDOS.has(p.status as StatusProposta)
  );
}

export async function GET() {
  const propostas = await lerPropostasSalvas();
  const porStatus = Object.fromEntries(
    [...ESTAGIOS_FUNIL, "nao_aprovada" as const].map((s) => [s, propostas.filter((p) => p.status === s).length])
  );
  return Response.json({ total: propostas.length, porStatus });
}

export async function POST(request: Request) {
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return Response.json({ erro: "Corpo da requisição não é um JSON válido." }, { status: 400 });
  }

  const propostas = (corpo as { propostas?: unknown })?.propostas;
  if (!Array.isArray(propostas)) {
    return Response.json({ erro: "Esperava um campo 'propostas' com uma lista." }, { status: 400 });
  }

  const validas = propostas.filter(ehPropostaValida).map((p) => ({
    ...p,
    id: p.id || `imp-${p.numero}`,
    proximoContato: typeof p.proximoContato === "string" ? p.proximoContato : null,
    integrada: p.status === "concluida",
  }));

  if (validas.length === 0) {
    return Response.json({ erro: "Nenhuma proposta válida no corpo da requisição." }, { status: 400 });
  }

  const resumo = await mesclarESalvar(validas);
  return Response.json(resumo);
}
