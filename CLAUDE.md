# Barbearia Web

> Memória de projeto para o Claude Code. Curto e de alto sinal. Regras compartilhadas ficam em `AGENTS.md`.

@AGENTS.md

## Diretrizes de comportamento

1. **Pense antes de codar.** Declare hipóteses. Se houver mais de uma interpretação, apresente-as em vez de escolher em silêncio. Se algo estiver realmente ambíguo, pare e pergunte.
2. **Simplicidade primeiro.** O mínimo de código que resolve o problema. Sem funcionalidades especulativas, sem abstração para uso único, sem configurabilidade não pedida.
3. **Mudanças cirúrgicas.** Toque só no que o pedido exige. Siga o estilo existente. Não refatore nem "melhore" código adjacente.
4. **Execução orientada a objetivo.** Transforme tarefas em metas verificáveis ("corrigir o bug" vira "escrever um teste que reproduz e fazê-lo passar"). Em trabalho de vários passos, declare um plano curto com verificação por passo.
5. **Orquestrador, não implementador.** A sessão principal planeja, decide e coordena; implementação delegável vai para um especialista, em paralelo quando os escopos não conflitam.

## Stack

TypeScript · Next.js (App Router) + React · Tailwind CSS · Drizzle ORM + PostgreSQL · Zod · Pino · Vitest · npm
Integrações por fase: gateway Pix (conta de cada barbearia) e WhatsApp Business via BSP oficial

## Comandos canônicos

Use exatamente estes (confirme contra `package.json` após o bootstrap).

- **Instalar:** `npm install`
- **Dev:** `npm run dev`
- **Lint:** `npm run lint`
- **Tipos:** `npm run typecheck`
- **Testes:** `npm run test`
- **Build:** `npm run build`
- **Tudo:** `npm run check`
- **Migrations:** `npm run db:generate` / `npm run db:migrate` (só em destino autorizado)

## Arquitetura (resumo)

Detalhes e árvore de pastas em `docs/architecture.md`.

- **Multi-tenant:** uma base de código e um banco para todas as barbearias. O host define a barbearia (`src/proxy.ts` + `getShopByHost`); toda tabela de negócio tem `shop_id`.
- **Organização por funcionalidade** em `src/features/*`, criando só as pastas da fase atual (`docs/roadmap.md`). Cada uma tem `components/`, `server/` (queries, actions), `schemas.ts` (Zod) e `types.ts`.
- **`src/app/`** só roteia e compõe: páginas finas que chamam módulos de `features/`. Nada de regra de negócio em `page.tsx`.
- **Server Components por padrão.** `"use client"` só para interatividade real: filtros, modal, polling do termômetro.
- **Catálogo** renderizado no servidor; filtros vivem na **URL** (`searchParams`), não em estado local.
- **Modal do corte** via *intercepting route* (`@modal/(.)cortes/[slug]`) com página completa de fallback em `cortes/[slug]`. Mesma URL, mesmo conteúdo.
- **Termômetro** é um Client Component que consulta `GET /api/fila` a cada 30 s e pausa quando a aba está oculta. A leitura vem de `features/queue/server`, e a regra de validade fica em uma função pura testada.
- **Mutação da fila** apenas por Server Action em `features/queue/server/actions.ts`: valida sessão, valida entrada com Zod, grava e chama `revalidatePath`.
- **Banco** acessado só por `src/server/db`, e consultas de negócio só por `tenantDb(shopId)`. Componentes de UI nunca importam o banco.
- **Regras de tempo e dinheiro** (disponibilidade, sinal, tolerância, atraso, reembolso, espera) são funções puras em `features/booking` e `features/queue`, conforme `docs/business-rules.md`.
- **Pagamentos e WhatsApp** ficam atrás de portas próprias (`features/payments`, `features/notifications`), com um adaptador cada. Webhooks: verificar, deduplicar, confirmar no gateway.
- Funcionalidades de fases futuras não existem no código. Não deixe stubs.

## Guia de estilo

### Código
- TypeScript `strict`. Sem `any`; use `unknown` e estreite com Zod.
- Prefira tipos inferidos (`z.infer`, tipos do Drizzle) a tipos escritos à mão.
- Componentes funcionais, um componente exportado por arquivo, nomes em `PascalCase`; arquivos de componente em `kebab-case.tsx`.
- Funções puras para regras de domínio (ex.: `getQueueDisplayState(status, now)`), recebendo `now` como parâmetro para facilitar teste.
- Nomes de código em inglês (`haircut`, `queue`, `barber`); texto de interface em pt-BR; URLs públicas em pt-BR (`/cortes`, `/painel`).
- Imports ordenados: externos, `@/` internos, relativos. Sem imports circulares entre features; features se comunicam por funções exportadas em `index.ts`.
- Arquivo com mais de 350 linhas deve ser dividido.

### Tailwind e UI
- Mobile-first: estilos base para 360 px, `sm:`/`md:`/`lg:` ampliam.
- Tokens de design (cores, raios, espaçamento) definidos uma vez no tema do Tailwind. Não use cores arbitrárias `[#xxxxxx]` espalhadas.
- Extraia componente, não classes `@apply`, quando repetir padrão.
- Ordem de classes consistente (use `prettier-plugin-tailwindcss`).
- Alvos de toque de pelo menos 44×44 px; o painel do barbeiro usa botões grandes.
- Estados explícitos em toda tela de dados: carregando, vazio, erro e desatualizado (termômetro).
- Imagens sempre com `next/image`, `alt` descritivo, dimensões definidas e `sizes` correto. Capas acima da dobra usam `priority`.

### Acessibilidade
- Modal: papel de diálogo, foco preso, `Esc` fecha, foco retorna ao card, fundo sem rolagem.
- Filtros como controles nativos rotulados; resultados anunciados via região `aria-live="polite"`.
- O termômetro não depende só de cor: texto + ícone + estado. Contraste AA.
- Navegação por teclado completa em todos os fluxos.

### Tratamento de erros e dados
- Entradas de formulário, `searchParams` e ambiente passam por Zod.
- Server Actions retornam `{ ok: true, data } | { ok: false, error }`; não lançam para erros esperados.
- Queries com projeção explícita, listagens limitadas e parametrizadas (Drizzle).
- Logs com Pino no servidor, sem segredos nem dados pessoais (telefone mascarado).
- Dinheiro em centavos inteiros e datas em UTC; use `lib/money.ts` e `lib/time.ts`, nunca aritmética de ponto flutuante nem `new Date()` solto nas regras (receba `now`).

### Testes
- Teste regras de domínio (validade do status, estados do termômetro, filtros do catálogo, validação Zod) e autorização das mutações.
- Testes ao lado do código (`*.test.ts`). Evite testes que apenas reproduzem a implementação.

## Roteamento de agentes especialistas

Quando o trabalho for delegável, despache o especialista adequado. Papéis completos e regras em `AGENTS.md`.

| Agente | Quando usar |
|---|---|
| `orchestrator` | Tarefas que cruzam domínios (ex.: nova funcionalidade com schema, UI e testes) ou exigem paralelismo |
| `backend-specialist` | Schema Drizzle, migrations, queries, server actions, auth e isolamento de tenant |
| `integrations-specialist` | Gateway Pix, webhooks, reembolso, WhatsApp (BSP, templates, bot restrito), tarefas agendadas |
| `frontend-specialist` | Vitrine, filtros, modal, termômetro, painel, Tailwind e acessibilidade |
| `test-engineer` | Testes das regras de domínio após implementar lógica nova |
| `code-reviewer` | Após editar qualquer arquivo-fonte; revisão somente leitura |
| `security-reviewer` | Antes de concluir mudanças em auth, painel, isolamento de tenant, pagamentos, webhooks, validação ou segredos |

Se o host não tiver esses subagentes instalados, a sessão principal exerce o papel. Nomes ilustrativos não são capacidades instaladas.

## Fluxo de desenvolvimento

1. Leia `PRODUCT.md` e o critério de aceite da tarefa.
2. Para pedidos ambíguos ou novas funcionalidades, faça brainstorming curto e proponha plano com verificação por passo.
3. Implemente a menor mudança suficiente.
4. Rode `npm run check` e, para UI, abra a tela no navegador local e confira teclado, foco, estados e console.
5. Atualize o documento responsável (`PRODUCT.md`, `docs/*.md`).
6. Informe o que foi feito, o que foi verificado e o que ficou pendente. Depois, sugira os ciclos de review conforme `AGENTS.md`.

## Saiba mais

- Produto, fluxos e aceite: `PRODUCT.md`
- Regras de reserva, sinal e atraso: `docs/business-rules.md`
- Fases e plano: `docs/roadmap.md`
- Identidade visual e tokens: `docs/design.md` (referência navegável em `docs/design-reference.html`)
- Passo a passo da primeira sessão: `docs/handoff.md`
- Estrutura de pastas e decisões: `docs/architecture.md`
- Regras compartilhadas para agentes: `AGENTS.md`
- Toolkit de origem: https://github.com/soumatheusgomes/vibe-coding-toolkit
