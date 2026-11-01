# Barbearia Web

> Instruções compartilhadas para qualquer agente de IA (Claude Code, Codex e equivalentes). Mantenha curto; detalhes ficam nos documentos indicados. `CLAUDE.md` importa este arquivo.

## Produto e stack

- Produto e escopo: `PRODUCT.md`. Regras de tempo e dinheiro: `docs/business-rules.md`. Fases: `docs/roadmap.md`. Riscos e soluções: `docs/risks-and-processes.md`. Identidade visual: `docs/design.md` e `docs/design-reference.html`. Primeira sessão: `docs/handoff.md`. Em conflito entre código e esses documentos, pare e pergunte.
- Stack: Next.js (App Router) · React · TypeScript · Tailwind CSS · Drizzle ORM + PostgreSQL · Zod · Pino · Vitest · npm.
- Integrações (por fase): gateway Pix (conta de cada barbearia) e WhatsApp Business via BSP oficial. Infraestrutura: VPS com Coolify e Cloudflare R2, sem Vercel.
- Estrutura e decisões: `docs/architecture.md`. Setup e evidências: `docs/setup.md` (gerado pelo bootstrap).
- Idioma: interface e documentação em português do Brasil; identificadores de código em inglês.

## Comandos canônicos

Confirme contra o `package.json` real após o bootstrap. Não invente scripts: marque como indisponível o que não existir.

- Instalar: `npm install`
- Desenvolver: `npm run dev`
- Lint: `npm run lint`
- Tipos: `npm run typecheck`
- Testes: `npm run test`
- Build: `npm run build`
- Gerar migration: `npm run db:generate`
- Aplicar migration (somente destino autorizado): `npm run db:migrate`
- Verificar base: `npm run check` (lint + tipos + testes + build)

## Acordos de trabalho

- Leia o código e as instruções pertinentes antes de editar. Declare hipóteses que alterem comportamento ou escopo.
- Entregue a menor mudança suficiente. Reutilize padrões, componentes e dependências existentes.
- Não crie abstrações, opções, dependências ou funcionalidades para necessidades não pedidas. **Implemente só a fase atual do `docs/roadmap.md`: não crie código, tabelas ou pastas de fases futuras.**
- Preserve validação, tratamento de erros, segurança e acessibilidade.
- Não transforme hipóteses em fatos nem integração pendente em resultado simulado.
- Execute checks adequados e informe o resultado real. Mudanças triviais não precisam de testes que só espelham a implementação.
- Continue trabalho já autorizado. Pergunte só por informação indispensável ou ação fora da autorização.
- Publicação (deploy), custos, mensagens a terceiros e ações destrutivas exigem autorização explícita. Isso inclui qualquer acesso ao VPS, ao Coolify, ao R2 e a backups.

## Regras de domínio (inegociáveis)

- **Status de fila nunca é apresentado como atual quando está velho.** A regra de validade (2 h por padrão) vive em um único lugar no código e é coberta por teste.
- **Só usuário autenticado da própria barbearia altera a fila e o painel.** Toda mutação valida sessão, papel e entrada no servidor, nunca só no cliente.
- **Isolamento de barbearias é inegociável.** Toda consulta de negócio passa por `tenantDb(shopId)`; toda tabela de negócio tem `shop_id`. Mudança que toque isolamento exige teste entre dois tenants.
- **Dinheiro e tempo são regra de domínio.** Valores em centavos inteiros (`lib/money.ts`); datas em UTC, exibidas no fuso da barbearia. Sinal, tolerância, atraso e reembolso vivem em funções puras com teste de borda e seguem `docs/business-rules.md`.
- **A plataforma nunca retém valores.** Pagamentos vão para a conta de gateway da barbearia. Webhooks são autenticados, idempotentes e confirmados no gateway; não confie no corpo recebido.
- **Política vigente é gravada com a reserva.** Nunca recalcule uma reserva existente com política nova.
- **WhatsApp: só API oficial, só templates de utilidade, bot restrito.** Nada de assistente de propósito geral nem marketing. Mensagem cita a barbearia. Respeite opt-out.
- **Dados pessoais (LGPD):** colete só nome, telefone e consentimento, a partir da Fase 2. Telefone mascarado em logs. Sem analytics invasivo nem cookies de rastreamento.
- **Fotos de clientes exigem consentimento registrado** e ficam em bucket privado com URL assinada, sem EXIF. Não adicione imagens de pessoas reais sem confirmação do dono.
- **Retenção LGPD:** 12 meses após a última atividade, depois agregação e exclusão dos registros individuais; exclusão sob pedido. A restauração de backup reaplica as exclusões.
- **Nenhuma questão fica em aberto:** valores e escolhas estão decididos nos documentos; gates de liberação em `PRODUCT.md` (seção 15). Não invente valor novo: leia a configuração.
- **Falha da plataforma nunca pune o cliente.** Tarefa atrasada, aviso não entregue ou webhook perdido não geram retenção automática. Chaves de cache, sessão e cookies são sempre por barbearia.
- **"Multa" é só a retenção do sinal.** Nunca implemente cobrança fora da faixa do sinal (20–30%): taxas de reagendamento são retenção de parte do sinal ou sinal reforçado abatido do preço. O barbeiro pode dispensar ou reduzir taxas, nunca aumentá-las. Cancelamento automático só ocorre sem check-in; cliente com check-in nunca é penalizado. O barbeiro só pode ser mais brando que os termos, nunca mais duro. Quem aplica retenção e reembolso é função pura com teste, não o bot de IA.
- Segredos da plataforma só em variáveis de ambiente validadas por Zod; credenciais de gateway de cada barbearia ficam criptografadas no banco. Nada disso vai ao cliente ou aos logs.

## Papéis dos agentes

Papéis são capacidades de trabalho, não garantia de que existam como subagentes instalados. Use as ferramentas reais do host; se um papel não existir, o agente principal o exerce.

| Papel | Responsabilidade | Pode escrever em | Não faz |
|---|---|---|---|
| **Coordenador** (sessão principal) | Entende o pedido, quebra em tarefas, delega, integra, valida diff e checks. Dono de `package.json`, lockfile e configs compartilhadas | Configs compartilhadas, integração | Delegar o que é trivial; aceitar resultado sem checar diff |
| **Produto** | Mantém escopo, fluxos, aceite, regras de negócio e fases | `PRODUCT.md`, `docs/business-rules.md`, `docs/roadmap.md` | Alterar código |
| **Frontend** | Vitrine, modal, termômetro, painel, estilo Tailwind, acessibilidade | `src/app/**` (UI), `src/features/*/components/**`, `src/components/**` | Tocar em schema de banco ou auth |
| **Backend/Dados** | Schema Drizzle, migrations (inclui SQL manual de restrições), queries, server actions, auth, isolamento de tenant | `src/server/**`, `src/features/*/server/**`, `drizzle/**` | Alterar UI além do contrato de dados |
| **Integrações** | Gateway Pix, webhooks, reembolso, BSP do WhatsApp, templates, bot restrito, tarefas agendadas | `src/features/payments/**`, `src/features/notifications/**`, `src/app/api/webhooks/**`, `src/app/api/cron/**`, `src/server/jobs/**` | Alterar regras de `docs/business-rules.md` sem aprovação do Produto |
| **Testes** | Testes unitários e de integração das regras de domínio | `**/*.test.ts(x)`, `tests/**` | Alterar código de produção sem aprovação do coordenador |
| **Revisor** | Revisão somente leitura: bugs, regressões, segurança, acessibilidade | Nada (relatório) | Editar arquivos |
| **Segurança** | Revisão de auth, validação, segredos, LGPD. Obrigatório antes de concluir mudanças em auth/painel | Nada (relatório) | Editar arquivos |

### Regras de delegação

- Delegue apenas quando isolamento de contexto, especialização ou paralelismo independente compensarem a coordenação. Tarefas simples ficam com o agente principal.
- Cada tarefa delegada recebe: objetivo, contexto mínimo, arquivos permitidos, dependências, critérios de aceite e checks.
- **Um escritor por arquivo.** Tarefas paralelas usam arquivos distintos. Revisores paralelos trabalham só em leitura.
- Ordem típica de uma funcionalidade: Backend/Dados (contrato e schema) → Frontend → Testes → Revisor/Segurança.
- Antes de aceitar o trabalho de um agente: confira o diff e rode os checks.
- Se um agente falhar ou ficar em estado incerto, confirme que parou antes de assumir seus arquivos; retome do ponto verificado.
- Não repita tentativa idêntica sem evidência nova. Respeite limites de tempo, custo e tentativas.
- Ao retomar por handoff, confira arquivos, Git, checks e processos reais; um resumo anterior não prova o estado atual.

## Revisão

- Após cada ciclo de implementação ou correção, sugira ao usuário de **3 a 8 ciclos de code review** conforme risco e escopo, com motivo e um prompt copiável (número, focos, checks reais). A sugestão não autoriza executar rodadas sozinho.
- Focos recomendados para este projeto: (1) isolamento entre barbearias; (2) pagamentos, webhooks e reembolso; (3) regras de tempo e dinheiro; (4) auth, LGPD e WhatsApp; (5) acessibilidade e desempenho; (6) integração e regressões.
- Cada achado registra severidade, local e evidência. Correções internas não reiniciam a contagem de rodadas.

## Padrões e documentação

- Persistência: Drizzle + PostgreSQL com driver compatível com o runtime. Conexão de servidor única, pool limitado, inicialização sob demanda. Revise o SQL gerado antes de migrar; **não migre no build nem por request**.
- Valide entradas e ambiente com Zod. Use Pino no servidor, sem segredos nem corpos completos de requisição.
- Componentes de UI não importam o cliente de banco; chamam módulos da funcionalidade.
- Consulte documentação oficial atual (Context7 quando disponível) antes de alterar APIs de Next.js, Tailwind ou Drizzle. Não migre versões principais automaticamente.
- Documento responsável pela mudança é atualizado junto dela: `PRODUCT.md` (escopo), `docs/business-rules.md` (regras de reserva e dinheiro), `docs/roadmap.md` (fases), `docs/architecture.md` (estrutura e decisões), `docs/design.md` (interface), `docs/onboarding.md` (preparação), `docs/quality.md` (checks).

## Ferramentas e estilo

- Verifique instalação e descoberta antes de depender de uma ferramenta. Preferência escrita não instala plugin.
- **Ponytail** (`full`): reutilize o que existe e entregue a menor mudança completa.
- **Caveman**: conversa concisa no idioma do usuário; código, documentação e commits com redação normal.
- **Superpowers**: use skills pertinentes (brainstorming, planejamento, verificação) proporcionais ao escopo.
- **Context7**: consulte APIs e setup atuais; nunca envie segredos ou código privado.
- **RTK**: use quando houver comandos suportados, sem duplicar com hook nativo.
- Instalar uma skill ou ferramenta não executa suas ações (deploy, animações, cache, mudança de arquitetura).

## Git e colaboração

- Sem bloqueios de push em `main`, sem exigência de branch/worktree e sem hooks `pre-commit`/`pre-push` por padrão.
- Lint, tipos, testes e build são checks explícitos. Commits só quando solicitados.
- Mensagens de commit no formato Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).

## Convenções e contexto

- Imports com alias `@/` apontando para `src/`.
- Organização por funcionalidade em `src/features/*`; detalhes em `docs/architecture.md`.
- Limite de **350 linhas por arquivo**; acima disso, divida por responsabilidade.
- Erros esperados retornam resultado tipado; exceções são para falhas inesperadas.
