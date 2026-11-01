# Handoff para o Claude Code — primeira sessão

> Leia este arquivo primeiro. Ele diz o que já está decidido, o que fazer em que ordem e o que não fazer. Em conflito entre este arquivo e os documentos de origem, vale o documento de origem.

## 1. Estado do projeto

- **Produto:** Barbearia Web, um SaaS multi-tenant para barbearias de Parnaíba. Dois planos: Base (R$ 200 de implantação, R$ 60 por mês) e Premium completo (R$ 400, R$ 80 por mês). Detalhes em `PRODUCT.md`.
- **Decisões fechadas:** não há questão em aberto. Valores e escolhas estão em `PRODUCT.md` (seção 14, decisões 1 a 38) e `docs/business-rules.md`. As verificações externas (advogado, contador, Meta, gateway) são **gates** de liberação na seção 15 do `PRODUCT.md`; elas não bloqueiam o desenvolvimento.
- **Fase atual:** Fase 0 (alinhamento e provas de conceito) e, em seguida, Fase 1 (MVP vendável). Não crie código, tabelas ou pastas das fases 2 a 5.
- **Identidade visual:** `docs/design.md` (tokens, componentes, textos) e `docs/design-reference.html` (abra no navegador). A origem das ideias está em `docs/reference/rota360-site.zip`.

## 2. Arquivos a copiar para a raiz do repositório

```
PRODUCT.md  AGENTS.md  CLAUDE.md
docs/architecture.md  docs/business-rules.md  docs/roadmap.md
docs/risks-and-processes.md  docs/design.md  docs/design-reference.html
docs/handoff.md  docs/reference/rota360-site.zip
```

## 3. Prompt de bootstrap (prompt 11 do toolkit)

Rode no Claude Code, na pasta do repositório, com os arquivos acima já copiados:

```
Read https://raw.githubusercontent.com/soumatheusgomes/vibe-coding-toolkit/main/docs/prompts/11-next-project-bootstrap.md and execute setup in this directory.

Project: Barbearia Web, SaaS multi-tenant (uma base de código e um banco, isolamento por shop_id, domínio e tema por barbearia) para barbearias de Parnaíba. Fase atual: Fase 1 de docs/roadmap.md. Interface em pt-BR. Identidade visual em docs/design.md.

Já existem PRODUCT.md, AGENTS.md, CLAUDE.md, docs/architecture.md, docs/business-rules.md, docs/roadmap.md, docs/risks-and-processes.md, docs/design.md e docs/handoff.md. Incorpore em vez de sobrescrever. Gere apenas o que falta (README.md, docs/onboarding.md, docs/quality.md, docs/setup.md). Não gere um novo docs/design.md: use o existente. Não crie código, tabelas ou pastas de fases futuras.
```

## 4. Ordem de trabalho depois do bootstrap

1. **Fase 0 (sem código de produto):** seguir `docs/roadmap.md`. Entregar as provas de conceito de domínio e certificado (Traefik e Caddy sob demanda) e de backup com restauração, no VPS. Registrar o resultado em `docs/setup.md`.
2. **Fase 1, passo 1 — base multi-tenant:** schema Drizzle (`shops`, `users`, `shop_members`), `tenantDb(shopId)`, resolução por host, tema por variáveis CSS, `scripts/create-shop.ts` e o **teste de isolamento entre duas barbearias**. Cookies e cache por host (D28 e D29).
3. **Passo 2 — design system:** tokens de `docs/design.md` no tema do Tailwind, fonte Outfit com `next/font`, componentes base (botão, filtro em pílula, painel de vidro, modal).
4. **Passo 3 — autenticação e painel:** login por barbearia, papéis dono e barbeiro, ações **Iniciar** e **Finalizar**, atualização da fila por Server Action.
5. **Passo 4 — termômetro:** função pura `getQueueDisplayState(status, now)` com teste de borda de validade (120 min), `GET /api/fila` com cache curto, anel SVG conforme `docs/design.md`.
6. **Passo 5 — catálogo:** vitrine com filtros na URL, modal por intercepting route com página completa de fallback, gestão de cortes e upload de fotos para o R2.
7. **Passo 6 — página pública da plataforma e deploy:** planos e contato por WhatsApp, política de privacidade, deploy no VPS pelo Coolify com imagem construída na integração contínua.

Ao fim de cada passo: `npm run check`, atualizar o documento responsável e sugerir os ciclos de review conforme `AGENTS.md`.

## 4a. Primeira tarefa sugerida (cole depois do bootstrap)

```
Leia docs/handoff.md, PRODUCT.md e docs/roadmap.md. Faça o Passo 1 da seção 4 do handoff (base multi-tenant) como menor mudança suficiente, com plano curto e verificação por passo. Comece pelo teste de isolamento entre duas barbearias. Não crie nada de fases futuras. Ao terminar, rode npm run check e informe o resultado real.
```

## 5. Regras que mais quebram se esquecidas

- Toda consulta de negócio passa por `tenantDb(shopId)`; chaves de cache e cookies são por barbearia.
- Status de fila nunca aparece como atual quando está velho.
- Dinheiro em centavos; datas em UTC, exibidas em `America/Fortaleza`; regras de tempo e dinheiro são funções puras que recebem `now`.
- Falha da plataforma nunca pune o cliente. "Multa" é só retenção do sinal e nunca aparece na interface.
- Nada de segredos no cliente ou nos logs; telefone mascarado em logs.
- Publicação, custos, mensagens a terceiros e acesso ao VPS exigem autorização explícita.
