export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function formatarMoedaCompacta(valor: number): string {
  if (Math.abs(valor) >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  if (Math.abs(valor) >= 1_000) return `R$ ${(valor / 1_000).toFixed(1).replace(".", ",")} mil`;
  return formatarMoeda(valor);
}

export function formatarNumero(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

export function formatarPercentual(valor: number, casas = 0): string {
  return `${(valor * 100).toFixed(casas).replace(".", ",")}%`;
}

export function formatarPercentualComSinal(valor: number, casas = 0): string {
  const sinal = valor > 0 ? "+" : "";
  return `${sinal}${formatarPercentual(valor, casas)}`;
}
