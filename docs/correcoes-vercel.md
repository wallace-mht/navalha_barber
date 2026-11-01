# Correções do navalha_barber (build na Vercel)

> Análise estática: não havia rede aqui para instalar dependências nem rodar `npm run build`, e o log de erro da Vercel não foi enviado. Os arquivos abaixo **não foram testados em build**. Rode `npm run check` localmente antes de subir.

## Como aplicar

1. Copie o conteúdo desta pasta **por cima** do projeto (mesmos caminhos).
2. **Apague** do projeto: `tailwind.config.ts` (o Tailwind 4 ignora esse arquivo) e a pasta `barbearia1/` (cópia antiga dos documentos).
3. `npm run check` local.
4. Na Vercel, em Settings > Environment Variables, cadastre `DATABASE_URL` (URL do Neon) e `DEFAULT_SHOP_SLUG=demo`.
5. Crie as tabelas no Neon: `npm run db:generate`, revise o SQL em `drizzle/`, e `DATABASE_URL=... npm run db:migrate`. Faça commit da pasta `drizzle/`.
6. Rode `scripts/seed.sql` no editor SQL do Neon.
7. Novo deploy.

## Problemas encontrados

| # | Gravidade | Problema | Correção |
|---|---|---|---|
| 1 | Quebra o build | `cacheComponents: true` com `page.tsx` que acessa banco e `new Date()` fora de `<Suspense>`: o Next 16 recusa a rota ("uncached data accessed outside of Suspense"). `partialPrefetching` também não é necessário | `next.config.ts` sem as duas opções; página com `export const dynamic = "force-dynamic"` |
| 2 | Quebra o build | A home consulta o banco durante o build (pré-renderização). Sem `DATABASE_URL`, o código caía num `localhost` que a Vercel não alcança | Conexão criada sob demanda (`getDb()`), `DATABASE_URL` validada com Zod só na primeira leitura, sem valor padrão silencioso |
| 3 | Quebra em produção | Não existe pasta `drizzle/` (nenhuma migration) e nenhum passo cria as tabelas: `relation "shops" does not exist` | Passos 5 e 6 acima; `scripts/seed.sql` |
| 4 | Quebra o `db:generate` | `drizzle.config.ts` aponta `schema` para `./src/server/db/schema` (sem `.ts`), mas o schema é um arquivo | Caminho corrigido para `schema.ts` |
| 5 | Visual quebrado | `globals.css` usa `@tailwind base/components/utilities` (sintaxe do Tailwind 3) e `tailwind.config.ts` é ignorado no Tailwind 4: as cores `noite`, `brasa`, `nevoa` e as classes `bg-vidro`, `border-vidro-borda` não existiam | `@import "tailwindcss"` e `@theme` com todos os tokens de `docs/design.md` |
| 6 | Violação de regra | `getShopByHost` ignorava o host (fixo em `"matriz"`) e **criava barbearia e fila durante uma leitura** (escrita em GET, corrida entre requisições) | Resolução real por domínio, subdomínio e `DEFAULT_SHOP_SLUG`; nenhuma escrita em leitura |
| 7 | Violação de regra | `tenantDb` era só um stub e as consultas usavam `db` direto, contra a regra inegociável de isolamento | `tenantDb(shopId)` agora executa as consultas já filtradas por `shop_id`; features só usam ele |
| 8 | Bug de domínio | `getQueueDisplayState` tinha `now = new Date()` como padrão (esconde a dependência de relógio), estado desconhecido virava "Fila normal" e atualização no futuro não era tratada | `now` obrigatório, constante única `QUEUE_STALE_AFTER_MINUTES`, desconhecido vira "Status indisponível"; testes de borda de 120 min, futuro e desconhecido |
| 9 | Configuração | `.gitignore` tem `.env*`, que também ignora `.env.example` (o `setup.md` manda copiá-lo e ele nunca é versionado) | `!.env.example` e arquivo criado |
| 10 | Acabamento | `layout.tsx` com idioma `en`, título "Create Next App" e fonte Geist, enquanto o design usa Outfit | `pt-BR`, título real, Outfit via `next/font` |
| 11 | Acabamento | Sem `not-found.tsx` nem `error.tsx` | Criados |
| 12 | Documentos | `docs/business-rules.md`, `design-reference.html` e `docs/reference/` não foram copiados (o `AGENTS.md` manda parar em conflito com esse arquivo); `barbearia1/` duplica documentos antigos | Arquivos incluídos; apague `barbearia1/` |

## Observações

- **`@tailwindcss/turbopack` com `turbopack.rules`** é uma configuração incomum; o caminho documentado do Tailwind 4 no Next é `@tailwindcss/postcss` com `postcss.config.mjs`. Mantive o que existe porque trocar exige `npm install` para atualizar o `package-lock.json`. Se o build falhar em CSS, essa é a primeira suspeita.
- **Vercel x decisão de infraestrutura:** os documentos decidem produção em VPS com Coolify e PostgreSQL próprio, e o código usa o driver HTTP do Neon (serverless). Vercel e Neon servem como demonstração e teste do piloto; para o VPS, o driver de banco muda (D20 e D32 em `docs/architecture.md`).
- **Dependências sem uso agora:** `pg`, `@types/pg` e `pino`. Inofensivas; remova depois com `npm uninstall` para o lock acompanhar.
- Nada aqui implementa funcionalidade de fases futuras.
