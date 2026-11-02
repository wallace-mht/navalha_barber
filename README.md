# Barbearia Web

SaaS multi-tenant para barbearias de Parnaíba (PI). Catálogo de cortes, termômetro de fila presencial e (nos planos superiores) agendamento e confirmações por WhatsApp.

## Stack

- **Framework:** Next.js (App Router) + React + TypeScript
- **Estilo:** Tailwind CSS
- **Banco de Dados:** PostgreSQL + Drizzle ORM
- **Validação:** Zod
- **Logs:** Pino
- **Testes:** Vitest

## Comandos

- `npm run dev` — Servidor de desenvolvimento
- `npm run build` — Build de produção
- `npm run typecheck` — Checagem de tipos TypeScript
- `npm run lint` — Linting com ESLint
- `npm run test` — Testes unitários com Vitest
- `npm run check` — Validação completa (lint + typecheck + test + build)
- `npm run db:generate` — Gerar migrations SQL
- `npm run db:migrate` — Aplicar migrations

## Documentação

- `PRODUCT.md` — Produto e escopo
- `AGENTS.md` — Regras compartilhadas para agentes
- `CLAUDE.md` — Memória e diretrizes de desenvolvimento
- `docs/architecture.md` — Arquitetura e decisões
- `docs/roadmap.md` — Fases e roadmap
- `docs/design.md` — Identidade visual e tokens
- `docs/risks-and-processes.md` — Riscos e processos
