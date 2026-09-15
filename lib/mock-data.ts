import type { Proposta, StatusProposta, Vendedor } from "./types";

/**
 * Dados de exemplo para o protótipo do dashboard.
 *
 * Os 43 registros marcados como REAIS foram lidos diretamente dos prints do
 * Tiny ERP enviados (propostas comerciais de agosto e setembro/2026, abas
 * "rascunhos" e "concluídas"). O restante é gerado de forma determinística
 * para preencher o histórico (jun-set/2026) e permitir os comparativos de
 * período — assim que a integração com a API do Tiny (ou uma exportação)
 * estiver disponível, `PROPOSTAS` deixa de ser usado e os componentes passam
 * a receber os dados reais no mesmo formato (ver `types.ts`).
 */

const REAIS: Array<
  [numero: number, dataCriacao: string, proximoContato: string, cliente: string, valor: number, vendedor: Vendedor, status: StatusProposta]
> = [
  // Agosto/2026 — aba "rascunhos"
  [4383, "2026-08-05", "2026-08-18", "T Rangel Moraes Limitada", 4393.89, "ana karolina", "rascunho"],
  [4387, "2026-08-10", "2026-08-18", "Condominio Parque Shopping Maceio", 8205.32, "ana karolina", "rascunho"],
  [4393, "2026-08-11", "2026-08-13", "Vale EPI Comer de Equip de Prot Ind Ltda", 5739.94, "ana karolina", "rascunho"],
  [4378, "2026-08-12", "2026-08-14", "Rasip Alimentos Ltda", 15174.36, "ana karolina", "rascunho"],
  [4396, "2026-08-13", "2026-08-17", "Metalurgica Riosulense SA", 8199.32, "ana karolina", "rascunho"],
  [4398, "2026-08-14", "2026-08-18", "GMS Uniformes Profissionais Ltda", 33813.6, "ana karolina", "rascunho"],
  [4401, "2026-08-14", "2026-07-02", "F.F. Guarulhos - Comercio de Material Eletrico, Hidraulico", 363.94, "ana karolina", "rascunho"],
  [4402, "2026-08-14", "2026-08-17", "World Seg Produtos para Seguranca Ltda", 2826.36, "ana karolina", "rascunho"],
  [4404, "2026-08-17", "2026-08-19", "Drpro Solutions Ltda", 4512.26, "ana karolina", "rascunho"],
  [4406, "2026-08-17", "2026-08-19", "New Parts Comercial Ltda", 61130.19, "ana karolina", "rascunho"],
  // Agosto/2026 — aba "concluídas"
  [4380, "2026-08-04", "2026-08-05", "Foco Solucoes Energeticas Ltda", 2756.8, "ana karolina", "concluida"],
  [4287, "2026-08-05", "2026-08-05", "Aesseal Brasil Ltda.", 1512.9, "ana karolina", "concluida"],
  [4384, "2026-08-06", "2026-08-06", "Beto-Mont Jundiai Ltda", 14728.2, "ana karolina", "concluida"],
  [4385, "2026-08-10", "2026-08-11", "Usimp - Usinagem e Estamparia em Metais Ltda", 368.92, "ana karolina", "concluida"],
  [4391, "2026-08-11", "2026-08-11", "MBS Eventos e Transportes Ltda", 4741.92, "ana karolina", "concluida"],
  [4329, "2026-08-12", "2026-08-12", "Epicam Equipamentos de Protecao Ltda", 9771.77, "ana karolina", "concluida"],
  [4356, "2026-08-12", "2026-08-12", "KM-Kalium Mineracao S/A", 9317.03, "ana karolina", "concluida"],
  [4382, "2026-08-12", "2026-08-13", "Linhanyl S A Linhas para Coser", 982.0, "ana karolina", "concluida"],
  [4375, "2026-08-13", "2026-08-13", "Centro Educacional Integrado Padre Santi Capriotti - CEI", 772.2, "ana karolina", "concluida"],
  [4379, "2026-08-17", "2026-08-19", "Tiago de Broi Ltda", 719.1, "ana karolina", "concluida"],
  [4408, "2026-08-18", "2026-08-18", "Tornearia Rondonopolis Ind e Com Ltda", 6802.45, "ana karolina", "concluida"],
  // Setembro/2026 — aba "rascunhos"
  [4440, "2026-09-01", "2026-09-03", "Ebara Bombas America do Sul Ltda", 1595.42, "ana karolina", "rascunho"],
  [4441, "2026-09-01", "2026-09-03", "Departamento de Agua e Esgotos", 33114.08, "ana karolina", "rascunho"],
  [4442, "2026-09-01", "2026-09-03", "Master Marine - Comercio e Exportacao Ltda", 1880.62, "ana karolina", "rascunho"],
  [4443, "2026-09-01", "2026-09-03", "Central Suprimentos Industrial Ltda", 1916.9, "ivis", "rascunho"],
  [4426, "2026-09-02", "2026-09-04", "Marly Michelli Ltda", 3888.22, "ana karolina", "rascunho"],
  [4445, "2026-09-02", "2026-09-04", "PWA - Servicos de Inspecao e Calibracao Ltda", 7461.01, "ana karolina", "rascunho"],
  [4446, "2026-09-02", "2026-09-04", "Steelmast Metalurgica Ltda", 5334.32, "ana karolina", "rascunho"],
  [4447, "2026-09-03", "2026-09-07", "Flashee Brasil Intermediacao de Servicos de Limpeza Ltda", 6043.6, "ana karolina", "rascunho"],
  [4449, "2026-09-03", "2026-09-07", "Suall Industria e Comercio Ltda", 2631.56, "ana karolina", "rascunho"],
  [4450, "2026-09-03", "2026-09-07", "Prime Eletrica e MRO Ltda", 3093.06, "ana karolina", "rascunho"],
  [4395, "2026-09-04", "2026-09-08", "Prime Eletrica e MRO Ltda", 5512.54, "ana karolina", "rascunho"],
  // Setembro/2026 — aba "concluídas"
  [4431, "2026-09-01", "2026-09-01", "F C Cavalca Cunha", 6676.39, "ana karolina", "concluida"],
  [4439, "2026-09-01", "2026-09-03", "Teles Hidraulica Ltda", 410.97, "ana karolina", "concluida"],
  [4444, "2026-09-01", "2026-09-03", "Transremocao Transportes Pesados, Remocoes Tecnicas e Armazen", 2567.37, "ivis", "concluida"],
  [4430, "2026-09-02", "2026-09-03", "Cooperativa de Trabalho Em Producao de Reciclagem e Benefici", 6000.0, "ana karolina", "concluida"],
  [4432, "2026-09-02", "2026-09-04", "C.B Morais Comercio de Produtos Alimenticios Ltda", 1197.2, "ana karolina", "concluida"],
  [4390, "2026-09-03", "2026-09-03", "Tecnogera - Locacao e Transformacao de Energia SA", 2450.5, "ana karolina", "concluida"],
  [4394, "2026-09-03", "2026-09-04", "Prime Eletrica e MRO Ltda", 2616.54, "ana karolina", "concluida"],
  [4452, "2026-09-04", "2026-09-09", "M. A. da Silva Leandro Ltda", 1506.0, "ana karolina", "concluida"],
  [4435, "2026-09-10", "2026-09-11", "Avantools Ferramentas para Manutencao Reparos e Operacoes Lt", 1728.65, "ana karolina", "concluida"],
  [4459, "2026-09-10", "2026-09-11", "Tanesfil Industria e Comercio Ltda", 1636.51, "ana karolina", "concluida"],
  [4464, "2026-09-11", "2026-09-11", "Protseg Epis e Ferramentas Ltda", 2550.0, "ana karolina", "concluida"],
];

const PROPOSTAS_REAIS: Proposta[] = REAIS.map(
  ([numero, dataCriacao, proximoContato, cliente, valor, vendedor, status]) => ({
    id: `r-${numero}`,
    numero,
    dataCriacao,
    proximoContato,
    cliente,
    valor,
    vendedor,
    status,
    integrada: status === "concluida",
  })
);

// --- Geração determinística de histórico para viabilizar os comparativos ---
// (jun/2026 até a véspera dos dados reais). Mesma "forma" observada nos
// prints: boa parte dos rascunhos fica parada, ~2/3 do que é resolvido vira
// concluída e ~1/3 não é aprovada.

function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260915);

const NOMES_BASE = [
  "Metalúrgica Aliança", "Comércio de Ferragens Santos", "Indústria Têxtil Bela Vista",
  "Distribuidora Nordeste", "Auto Peças Central", "Química Industrial Vitória",
  "Serralheria Nova Era", "Embalagens São Marcos", "Transportes Rio Verde",
  "Equipamentos de Proteção Segura", "Alimentos Boa Colheita", "Papelaria Central",
  "Elétrica Forte Luz", "Hidráulica Águas Claras", "Ferramentas Precisão",
  "Cooperativa Agroindustrial", "Laticínios Vale do Sol", "Móveis Planejados Horizonte",
  "Construtora Pilar", "Refrigeração Polar", "Usinagem Metal Fino",
  "Confecções Linha Bela", "Gráfica Impressul", "Logística Trans Brasil",
  "Mineração Serra Azul", "Plásticos Duraflex", "Vidraçaria Cristal",
  "Fundição São Jorge", "Calçados Passo Firme", "Bebidas Fonte Pura",
  "Sistemas Hidropneumáticos Sul", "Componentes Industriais Bragança", "Têxtil Rio Claro",
];
const SUFIXOS = [" Ltda", " S/A", " Eireli", " Comércio e Indústria Ltda", " - ME"];

function clienteAleatorio(): string {
  const nome = NOMES_BASE[Math.floor(rng() * NOMES_BASE.length)];
  const sufixo = SUFIXOS[Math.floor(rng() * SUFIXOS.length)];
  return `${nome}${sufixo}`;
}

function valorAleatorio(): number {
  const base = Math.pow(rng(), 2.2); // enviesado para valores menores, cauda longa
  return Math.round((300 + base * 70000) * 100) / 100;
}

function vendedorAleatorio(): Vendedor {
  return rng() < 0.85 ? "ana karolina" : "ivis";
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDias(d: Date, dias: number): Date {
  const novo = new Date(d);
  novo.setUTCDate(novo.getUTCDate() + dias);
  return novo;
}

function diasEntre(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// "Hoje" do protótipo: primeiro dia sem dados reais completos (12/09/2026,
// já que os prints mais recentes de setembro vão até 11/09). Mantém os
// comparativos de semana/mês coerentes com os prints enviados.
const HOJE = new Date("2026-09-15T00:00:00.000Z");

function definirStatus(dataCriacao: Date): {
  status: StatusProposta;
  proximoContato: string;
  integrada: boolean;
} {
  const diasDesdeCriacao = diasEntre(dataCriacao, HOJE);
  const sorteio = rng();

  let diasParaResolver: number;
  if (sorteio < 0.32) diasParaResolver = 1 + Math.floor(rng() * 3); // resolve rápido: 1-3 dias
  else if (sorteio < 0.58) diasParaResolver = 4 + Math.floor(rng() * 7); // resolve em 4-10 dias
  else diasParaResolver = 9999; // fica parada (rascunho "esquecido", como nos prints)

  if (diasDesdeCriacao < diasParaResolver) {
    const faltam = diasParaResolver - diasDesdeCriacao;
    if (diasParaResolver !== 9999 && faltam <= 2 && diasDesdeCriacao >= 1) {
      return {
        status: faltam === 1 ? "aguardando" : "pendente",
        proximoContato: toISO(addDias(dataCriacao, diasDesdeCriacao + 1)),
        integrada: false,
      };
    }
    return {
      status: "rascunho",
      proximoContato: toISO(addDias(dataCriacao, Math.min(diasDesdeCriacao + 3, 30))),
      integrada: false,
    };
  }

  const ganhou = rng() < 0.66; // proporção observada em agosto: 21 concluídas x 11 não aprovadas
  return {
    status: ganhou ? "concluida" : "nao_aprovada",
    proximoContato: toISO(addDias(dataCriacao, diasParaResolver)),
    integrada: ganhou,
  };
}

function gerarHistorico(): Proposta[] {
  const propostas: Proposta[] = [];
  let numero = 9000;
  const inicio = new Date("2026-06-01T00:00:00.000Z");

  for (let d = new Date(inicio); d <= HOJE; d = addDias(d, 1)) {
    const diaSemana = d.getUTCDay();
    if (diaSemana === 0 || diaSemana === 6) continue; // sem propostas no fim de semana

    const quantidadeNoDia = 1 + Math.floor(rng() * 3); // 1 a 3 por dia útil
    for (let i = 0; i < quantidadeNoDia; i++) {
      const { status, proximoContato, integrada } = definirStatus(d);
      propostas.push({
        id: `s-${numero}`,
        numero: numero++,
        dataCriacao: toISO(d),
        proximoContato,
        cliente: clienteAleatorio(),
        valor: valorAleatorio(),
        vendedor: vendedorAleatorio(),
        status,
        integrada,
      });
    }
  }
  return propostas;
}

// Agosto e a primeira quinzena de setembro têm um total já conhecido pelos
// prints enviados (contadores das abas do Tiny). Em vez de deixar a geração
// genérica (por idade) preencher esses dias, completamos exatamente até o
// total informado, com o mesmo status para todas as complementares — assim
// os cartões e o funil batem com o que aparece no Tiny nesses dois meses.
function gerarComplemento(inicioISO: string, fimISO: string, status: StatusProposta, quantidade: number, numeroInicial: number): Proposta[] {
  const inicio = paraDataUTC(inicioISO);
  const totalDias = diasEntre(inicio, paraDataUTC(fimISO)) + 1;
  const propostas: Proposta[] = [];

  for (let i = 0; i < quantidade; i++) {
    const dataCriacao = addDias(inicio, Math.floor(rng() * totalDias));
    let proximoContato: Date;
    let integrada = false;
    if (status === "concluida" || status === "nao_aprovada") {
      proximoContato = addDias(dataCriacao, 1 + Math.floor(rng() * 4));
      integrada = status === "concluida";
    } else if (status === "pendente" || status === "aguardando") {
      proximoContato = addDias(dataCriacao, 1 + Math.floor(rng() * 3));
    } else {
      proximoContato = addDias(dataCriacao, 3 + Math.floor(rng() * 12));
    }
    propostas.push({
      id: `g-${numeroInicial + i}`,
      numero: numeroInicial + i,
      dataCriacao: toISO(dataCriacao),
      proximoContato: toISO(proximoContato),
      cliente: clienteAleatorio(),
      valor: valorAleatorio(),
      vendedor: vendedorAleatorio(),
      status,
      integrada,
    });
  }
  return propostas;
}

function paraDataUTC(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

// Totais reais (prints enviados): agosto/2026 fechado em 57 propostas
// (25 rascunho + 11 não aprovada + 21 concluída); setembro/2026 até o dia 15
// soma 41 (28 rascunho + 1 pendente + 1 aguardando + 11 concluída). Os
// registros reais (acima) já cobrem uma parte — o restante é complementar.
const QTD_REAIS_AGO = { rascunho: 10, concluida: 11 };
const QTD_REAIS_SET = { rascunho: 11, concluida: 11 };

const COMPLEMENTO: Proposta[] = [
  ...gerarComplemento("2026-08-01", "2026-08-31", "rascunho", 25 - QTD_REAIS_AGO.rascunho, 7100),
  ...gerarComplemento("2026-08-01", "2026-08-31", "concluida", 21 - QTD_REAIS_AGO.concluida, 7200),
  ...gerarComplemento("2026-08-01", "2026-08-31", "nao_aprovada", 11, 7300),
  ...gerarComplemento("2026-09-01", "2026-09-15", "rascunho", 28 - QTD_REAIS_SET.rascunho, 7400),
  ...gerarComplemento("2026-09-01", "2026-09-15", "pendente", 1, 7500),
  ...gerarComplemento("2026-09-01", "2026-09-15", "aguardando", 1, 7510),
];

// O histórico sintético "genérico" (por idade) não deve sobrepor ago/set,
// já cobertos pelos registros reais + complemento acima.
const INICIO_DADOS_CONHECIDOS = "2026-08-01";
const FIM_DADOS_CONHECIDOS = "2026-09-15";

const HISTORICO_SINTETICO = gerarHistorico().filter(
  (p) => p.dataCriacao < INICIO_DADOS_CONHECIDOS || p.dataCriacao > FIM_DADOS_CONHECIDOS
);

export const PROPOSTAS: Proposta[] = [...HISTORICO_SINTETICO, ...COMPLEMENTO, ...PROPOSTAS_REAIS].sort((a, b) =>
  a.dataCriacao === b.dataCriacao ? a.numero - b.numero : a.dataCriacao.localeCompare(b.dataCriacao)
);

/** Data de referência ("hoje") usada em todo o protótipo para os comparativos de período. */
export const DATA_REFERENCIA = HOJE;

export const FONTE_DADOS = "amostra" as const;
