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

## Estado atual: importação por planilha (CSV)

O painel tem duas fontes de dados, escolhidas automaticamente:

- **Se já houver propostas importadas** (`data/propostas.json`, criado pela
  tela `/importar`), o painel usa esses dados reais e compara contra a data
  de hoje de verdade.
- **Caso contrário**, cai de volta para `lib/mock-data.ts` — uma amostra
  reconstruída a partir dos 4 prints enviados (propostas de agosto e
  setembro/2026), com um aviso visível no topo do painel ("Dados de
  exemplo"). 43 desses registros são reais (copiados linha a linha dos
  prints); o restante é gerado para completar os totais que os prints
  confirmaram por aba e simular um histórico anterior para os gráficos de
  tendência terem o que comparar.

### Como importar

1. Na Tiny, abra Propostas Comerciais, filtre a aba desejada (ex:
   "concluídas") e exporte como **CSV**.
2. No painel, clique em "Importar dados" (ou vá em `/importar`).
3. Escolha o arquivo. Se ele não tiver uma coluna de situação/status, escolha
   no seletor qual status essas linhas representam (ex: "Concluídas").
4. Confira a prévia e as linhas com erro (se houver), depois confirme.

Pode importar quantos arquivos quiser, de abas diferentes, quantas vezes
quiser: cada importação faz **upsert por número da proposta** — nunca perde
o que já foi importado antes, só atualiza o que mudou. Colunas reconhecidas
(case-insensitive, com ou sem acento): `Número`, `Data`, `Próx. Contato`,
`Cliente`, `Valor`, `Marcadores` (usado para extrair o(a) vendedor(a), ex:
"ana karolina, (televendas)" → "ana karolina") e, se existir, `Situação`/
`Status`. Delimitador `,` ou `;` é detectado automaticamente (Excel em
português exporta com `;`).

### Armazenamento

Os dados ficam numa tabela Supabase dedicada, `propostas_televendas`
(`lib/store.ts`), no mesmo projeto Supabase que a Americanvek já usa para
outros painéis (`americanvek-dash-pedidos`) — mas numa tabela própria,
isolada, sem tocar na tabela `propostas` usada pelo Plano Mestre FULL nem
nos jobs de sincronização que já existem lá. RLS habilitado; acesso via
`SUPABASE_URL` + `SUPABASE_ANON_KEY` (variáveis de ambiente, nunca
commitadas — ver `.env.local.example` se precisar recriar).

Rodar `npm run dev` **dentro deste ambiente de desenvolvimento** não
alcança `*.supabase.co` (rede restrita do sandbox) — funciona normalmente
fora daqui (localhost de vocês, ou já em produção na Vercel).

### Limitações desta primeira versão

- **Sem autenticação** no endpoint de importação (`/api/propostas`). Para uso
  interno tudo bem, mas não deixe a URL pública sem controle de acesso.

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:3000`. `npm run build` gera o build de produção;
`npm run lint` roda o ESLint. Precisa de `SUPABASE_URL` e `SUPABASE_ANON_KEY`
num `.env.local` (peça os valores a quem configurou o Supabase).

## Deploy (Vercel)

Projeto já criado e linkado ao repositório: **`televendas-dashboard`**, no
time `americanvek-projetos` (`prj_9su2kpXvrNM1TX4gxliEtYPwlBE8`). Faltam dois
passos manuais no painel da Vercel (a ferramenta usada para criar o projeto
não permite configurar isso por fora):

1. **Project Settings → Environment Variables**: adicionar `SUPABASE_URL` e
   `SUPABASE_ANON_KEY` (mesmos valores do `.env.local` local).
2. **Project Settings → Git**: trocar a Production Branch de `main` (criada
   vazia automaticamente pela primeira publicação) para
   `claude/televendas-dashboard-americanvek-k6hy0a`, que é onde todo o
   código real está.

Mudar a branch de produção já dispara um deploy novo automaticamente. Depois
disso, qualquer push nessa branch redeploya sozinho.

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
- `lib/import.ts` — parser de CSV e normalização (datas, valores em R$,
  extração de vendedor, mapeamento de status) sem depender de bibliotecas
  externas.
- `lib/store.ts` — leitura/escrita de `data/propostas.json` (upsert por
  número).
- `app/importar/` + `app/api/propostas/route.ts` — tela de upload e a rota
  que recebe as propostas já validadas no navegador e salva no store.
- `lib/tiny-oauth.ts` + `app/api/tiny/` — integração OAuth2 com a Tiny (ver
  "Próximos passos" abaixo; ainda em andamento).

### Como os comparativos funcionam

Semana e mês são sempre comparados **"até hoje"**, não por período fechado:

- **Semana**: segunda-feira até hoje vs. a mesma segunda-a-mesmo-dia da
  semana anterior.
- **Mês**: dia 1 até hoje vs. dia 1 até o mesmo dia do mês anterior.

Isso responde exatamente à pergunta "estamos na frente ou atrás do mesmo
ponto do período anterior?", em vez de comparar um período parcial com um
mês fechado inteiro.

## Próximos passos

### API do Tiny em tempo real (em andamento)

O ideal de longo prazo é buscar as propostas automaticamente, sem depender de
alguém lembrar de exportar. Estado atual:

- A **API v2** da Tiny (token simples) não tem endpoint de orçamentos —
  confirmado testando `orcamentos.pesquisa.php`, que retorna 404.
- O recurso existe na **API v3**, que usa **OAuth2**. Já cadastramos o
  aplicativo na Tiny (nome "Dashboard Televendas") com permissão de leitura
  em Orçamentos, e o fluxo de autorização está implementado:
  - `lib/tiny-oauth.ts` — troca de código por token, renovação automática via
    refresh_token. Usa a **service_role key** do Supabase (não a anon key),
    porque a tabela `tiny_oauth_tokens` guarda um token com acesso de leitura
    ao ERP ao vivo e não tem policy de RLS pra anon — fica isolada do resto
    do app de propósito.
  - `app/api/tiny/authorize` — visite uma vez, logado na Tiny, pra aprovar o
    acesso e gerar o primeiro refresh_token.
  - `app/api/tiny/callback` — recebe o retorno da Tiny e salva o token.
  - `app/api/tiny/sync` — **ainda em modo descoberta**: busca
    `GET /orcamentos` e devolve a resposta bruta, sem mapear pros campos de
    `Proposta` ainda. O formato exato do endpoint (nome certo, paginação,
    nomes de campo) não dá pra confirmar num ambiente sem acesso à Tiny —
    falta testar isso publicado e então implementar o mapeamento real +
    upsert via `mesclarESalvar` (a função já existe e não muda).
- Variáveis de ambiente necessárias (Vercel): `TINY_CLIENT_ID`,
  `TINY_CLIENT_SECRET` (Production + Preview) e `SUPABASE_SERVICE_ROLE_KEY`
  (Production + Preview — pegar em Supabase → Project Settings → API →
  service_role key).
- Falta ainda: confirmar o formato da resposta, implementar o mapeamento, e
  decidir a cadência de sincronização (a Tiny só mostra o status *atual* de
  cada proposta, não o histórico — vale considerar um snapshot diário em vez
  de só sobrescrever o estado corrente, pra os comparativos de período
  saírem exatos). Agendamento (Vercel Cron) só depois de validar que o
  fetch + mapeamento funcionam de verdade.

### Outros pontos em aberto

- Preciso de mais exemplos das abas **"pendentes"**, **"aguardando"** e
  **"aprovadas"** com linhas visíveis — só vi essas abas com 0/1 registro
  nos prints, então o comportamento delas no funil é uma estimativa.
- Confirmar se há mais vendedores(as) de televendas além de "ana karolina" e
  "ivis" (os únicos marcadores vistos nos prints).
- Depois de validado com a Americanvek, replicar o mesmo painel para a Ardut
  (provavelmente outro token/conta do Tiny — a estrutura já foi pensada para
  isso, bastando parametrizar a fonte de dados por empresa).
