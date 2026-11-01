# Setup — Barbearia Web

Documentação de instalação e preparação do ambiente.

## Pré-requisitos
- Node.js v24+
- PostgreSQL
- Cloudflare R2 (para armazenamento de fotos)
- Coolify (para VPS)

## Configuração
1. `npm install`
2. `cp .env.example .env` e preencher.
3. `npm run db:generate`
4. `npm run dev`

## Observações
- A infraestrutura de dev usa o banco local.
- O build de produção exige o ambiente completo configurado no Coolify.
- A aplicação é multi-tenant. O domínio local para teste pode ser simulado no `hosts`.
