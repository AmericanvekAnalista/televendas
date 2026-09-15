# Dashboard Televendas — Americanvek

Painel de acompanhamento das **Propostas Comerciais** do setor de televendas,
com comparativo automático contra o mesmo período da semana/mês anterior.

## O funil modelado

```
rascunho  →  pendente  →  aguardando  →  concluída
   |                                         ^
   proposta enviada    expedição lança   pedido de venda /
   ao cliente           volumetria        NF gerados
                                              |
                                    (ou)  não aprovada
```

- **Rascunho** — proposta enviada ao cliente, aguardando aceite.
- **Pendente** — cliente aceitou; aguardando a expedição lançar a volumetria.
- **Aguardando** — volumetria lançada; aguardando gerar o pedido de venda/NF.
- **Concluída** — pedido de venda / NF gerados.
- **Não aprovada** — proposta recusada ou perdida.
- **Aprovada** / **Modelo** — existem como abas no Tiny, mas ainda não temos
  exemplos reais de uso; ver "Próximos passos".

## Estado atual: protótipo com dados de exemplo

**Os números exibidos hoje não vêm do Tiny ao vivo.** `lib/mock-data.ts`
reconstrói os dados a partir dos 4 prints enviados (propostas de agosto e
setembro/2026, abas "rascunhos" e "concluídas"):

- 43 registros são **reais**, copiados linha a linha dos prints.
- O restante é gerado para (a) completar os totais que os prints confirmaram
  por aba (ex: agosto fechou com 57 propostas — 25 rascunho, 11 não
  aprovada, 21 concluída) e (b) simular um histórico anterior (jun–jul/2026)
  para os gráficos de tendência terem o que comparar.

Isso é o suficiente para validar o layout, as métricas e os comparativos —
mas os valores em si são ilustrativos. Assim que a fonte de dados real for
plugada, nada na interface muda: só `lib/mock-data.ts` é substituído (ver
abaixo).

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:3000`. `npm run build` gera o build de produção;
`npm run lint` roda o ESLint.

## Estrutura

- `lib/types.ts` — modelo de dados (`Proposta`, `StatusProposta`).
- `lib/mock-data.ts` — dados de exemplo (ver acima).
- `lib/metrics.ts` — agregações por status, cálculo dos períodos
  "semana/mês até hoje" e do período equivalente anterior, série de
  tendência, rascunhos parados.
- `lib/theme.ts` / `lib/use-modo.ts` — paleta (clara/escura) validada com a
  skill de dataviz e detecção do esquema de cores do sistema.
- `components/` — `PainelDashboard` (client, controla o toggle
  semana/mês) e os gráficos (`EstagiosFunil`, `TendenciaConcluidas`,
  `RankingVendedores`), todos server-driven a partir de `app/page.tsx`.

### Como os comparativos funcionam

Semana e mês são sempre comparados **"até hoje"**, não por período fechado:

- **Semana**: segunda-feira até hoje vs. a mesma segunda-a-mesmo-dia da
  semana anterior.
- **Mês**: dia 1 até hoje vs. dia 1 até o mesmo dia do mês anterior.

Isso responde exatamente à pergunta "estamos na frente ou atrás do mesmo
ponto do período anterior?", em vez de comparar um período parcial com um
mês fechado inteiro.

## Próximos passos (fonte de dados real)

Para sair do protótipo, `lib/mock-data.ts` precisa ser substituído por dados
reais do Tiny, mantendo o formato de `Proposta[]`. Duas abordagens possíveis
— a decisão de qual usar (e o token da API, se for a primeira opção) ainda
depende da Americanvek:

1. **API do Tiny em tempo real** — uma rota de servidor
   (`app/api/propostas/route.ts` ou similar) busca as propostas
   periodicamente. Como o Tiny mostra o status *atual* de cada proposta (não
   o histórico de mudanças), para comparativos de período totalmente
   precisos vale guardar um snapshot diário (ex: em um banco) em vez de só
   consultar o estado corrente.
2. **Exportação manual (Excel/CSV)** — vocês exportam periodicamente do Tiny
   e sobem o arquivo; uma rotina converte para `Proposta[]`. Mais simples de
   colocar no ar, porém depende de atualização manual.

Outros pontos em aberto:

- Preciso de mais exemplos das abas **"pendentes"**, **"aguardando"** e
  **"aprovadas"** com linhas visíveis — só vi essas abas com 0/1 registro
  nos prints, então o comportamento delas no funil é uma estimativa.
- Confirmar se há mais vendedores(as) de televendas além de "ana karolina" e
  "ivis" (os únicos marcadores vistos nos prints).
- Depois de validado com a Americanvek, replicar o mesmo painel para a Ardut
  (provavelmente outro token/conta do Tiny — a estrutura já foi pensada para
  isso, bastando parametrizar a fonte de dados por empresa).
