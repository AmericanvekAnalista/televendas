export type StatusProposta =
  | "rascunho"
  | "pendente"
  | "aguardando"
  | "aprovada"
  | "concluida"
  | "nao_aprovada"
  | "modelo";

/** Vendedor(a) responsável pela proposta (marcador no Tiny). */
export type Vendedor = string;

export interface Proposta {
  id: string;
  numero: number;
  /** Data de criação/envio da proposta (ISO yyyy-mm-dd). */
  dataCriacao: string;
  /** Data do próximo contato / última movimentação (ISO yyyy-mm-dd). */
  proximoContato: string | null;
  cliente: string;
  valor: number;
  vendedor: Vendedor;
  status: StatusProposta;
  /** Presente quando a proposta já gerou pedido de venda / NF integrados. */
  integrada: boolean;
}

/** Estágios do funil, na ordem em que uma proposta avança. */
export const ESTAGIOS_FUNIL: StatusProposta[] = [
  "rascunho",
  "pendente",
  "aguardando",
  "concluida",
];

export const STATUS_LABEL: Record<StatusProposta, string> = {
  rascunho: "Rascunhos",
  pendente: "Pendentes",
  aguardando: "Aguardando",
  aprovada: "Aprovadas",
  concluida: "Concluídas",
  nao_aprovada: "Não aprovadas",
  modelo: "Modelos",
};

export const STATUS_DESCRICAO: Record<StatusProposta, string> = {
  rascunho: "Proposta enviada ao cliente, aguardando aceite",
  pendente: "Cliente aceitou; aguardando expedição lançar a volumetria",
  aguardando: "Volumetria lançada; aguardando gerar pedido de venda/NF",
  aprovada: "Aprovada manualmente",
  concluida: "Pedido de venda / NF gerados",
  nao_aprovada: "Proposta recusada ou perdida",
  modelo: "Modelo de proposta (não entra nos indicadores)",
};
