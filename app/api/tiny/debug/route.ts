import { obterTokenValido, TINY_API_BASE } from "@/lib/tiny-oauth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Diagnóstico temporário — investigar por que propostas com marcador "ivis"
 * na Tiny não aparecem no painel. Busca o item + detalhe bruto de números
 * específicos (não passa pelo filtro de vendedor). Remover depois de usar.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const numeros = (url.searchParams.get("numeros") ?? "").split(",").map((n) => n.trim()).filter(Boolean);
  if (numeros.length === 0) {
    return Response.json({ erro: "Use ?numeros=1194,1206,1207" }, { status: 400 });
  }

  let token: string;
  try {
    token = await obterTokenValido();
  } catch (e) {
    return Response.json({ erro: (e as Error).message }, { status: 400 });
  }

  // Decodifica o JWT sem chamar a Tiny de novo — só pra conferir pra qual
  // conta/permissões esse token foi emitido.
  let tokenPayload: unknown = null;
  try {
    const [, payload] = token.split(".");
    tokenPayload = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
  } catch {
    tokenPayload = "não foi possível decodificar";
  }

  const restantes = new Set(numeros);
  const encontrados: Record<string, unknown> = {};

  for (let offset = 0; restantes.size > 0; offset += 100) {
    const resp = await fetch(`${TINY_API_BASE}/orcamentos?limit=100&offset=${offset}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) {
      return Response.json({ erro: `Falha na listagem: HTTP ${resp.status}`, tokenPayload, encontrados, restantes: [...restantes] }, { status: 502 });
    }
    const pagina = await resp.json();
    if (!pagina.itens?.length) break;

    for (const item of pagina.itens) {
      if (!restantes.has(item.numeroProposta)) continue;
      restantes.delete(item.numeroProposta);

      const detalheResp = await fetch(`${TINY_API_BASE}/orcamentos/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const detalhe = detalheResp.ok ? await detalheResp.json() : null;
      encontrados[item.numeroProposta] = {
        id: item.id,
        situacao: item.situacao,
        assinatura: detalhe?.assinatura ?? null,
        detalheStatus: detalheResp.status,
      };
    }

    if (offset + 100 >= pagina.paginacao.total) break;
  }

  return Response.json({ tokenPayload, encontrados, naoEncontrados: [...restantes] });
}
