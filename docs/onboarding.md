# Onboarding — Barbearia Web

Guia para novos desenvolvedores ingressarem no projeto.

## 1. Leituras Essenciais
1. `PRODUCT.md` (Entenda o que é o SaaS e o escopo atual)
2. `docs/roadmap.md` (Veja em qual fase estamos)
3. `CLAUDE.md` e `AGENTS.md` (Convenções e regras inegociáveis)
4. `docs/architecture.md` (Estrutura de pastas e decisões)

## 2. Configurando o Ambiente
1. Clone o repositório.
2. Instale dependências: `npm install`
3. Crie o arquivo `.env` a partir de `.env.example`.
4. Rode os testes para verificar o ambiente: `npm run test`

## 3. Regras de Ouro
- Nunca crie código de fases futuras (respeite o roadmap).
- Isolamento de tenant por `shop_id` e `tenantDb` é obrigatório.
- Regras de tempo e dinheiro em funções puras testadas.
- Limite de 350 linhas por arquivo.
