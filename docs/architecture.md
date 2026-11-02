# Arquitetura — Barbearia Web

> Estrutura recomendada e decisões. Pastas e tabelas de uma fase só são criadas quando a fase começa (marcadas abaixo com **F2** a **F5**). Atualize este arquivo junto de mudanças estruturais.
> Regras de negócio: `docs/business-rules.md`. Fases: `docs/roadmap.md`.

## Estrutura de pastas

```
barbearia-web/
├── PRODUCT.md  AGENTS.md  CLAUDE.md  README.md
├── docs/
│   ├── architecture.md  business-rules.md  roadmap.md
│   └── design.md  onboarding.md  quality.md  setup.md   (gerados pelo bootstrap)
├── drizzle/                         Migrations SQL (revisadas antes de aplicar)
├── drizzle.config.ts
├── scripts/
│   ├── create-shop.ts               Cria barbearia, tema, domínio e usuário dono (F1)
│   └── seed.ts                      Dados fictícios para desenvolvimento
├── src/
│   ├── proxy.ts (ou middleware.ts)  Resolve o host e reescreve para o grupo de rotas do tenant
│   ├── app/
│   │   ├── layout.tsx  globals.css  not-found.tsx  error.tsx
│   │   ├── (tenant)/[domain]/       Tudo que a barbearia mostra, no domínio dela
│   │   │   ├── layout.tsx           Carrega a barbearia, aplica o tema (variáveis CSS), 404 se não existir
│   │   │   ├── page.tsx             Home: termômetro + vitrine com filtros
│   │   │   ├── @modal/default.tsx
│   │   │   ├── @modal/(.)cortes/[slug]/page.tsx   Modal (intercepting route)
│   │   │   ├── cortes/[slug]/page.tsx             Página completa do corte
│   │   │   ├── barbeiros/                          F2: perfis e escolha do barbeiro
│   │   │   ├── reservar/                           F2/F3: escolha de serviço, horário, dados e Pix
│   │   │   ├── reserva/[token]/                    F2/F3: acompanhar, cancelar, remarcar, escolher compensação
│   │   │   └── painel/                             Login, fila, cortes (F1); agenda (F2); indicadores (F4)
│   │   ├── (platform)/              F1: página pública da plataforma (planos e contato); F5: painel do operador e contratação self-service (host reservado)
│   │   └── api/
│   │       ├── fila/route.ts        GET público: status da fila da barbearia do host (F1)
│   │       ├── webhooks/
│   │       │   ├── whatsapp/route.ts                       F2: mensagens e status recebidos do BSP
│   │       │   └── payments/[provider]/[shopId]/route.ts   F3: eventos do gateway
│   │       └── cron/…               F2/F3: expiração, confirmações, lembretes, reconciliação (protegido por CRON_SECRET)
│   ├── features/                    Uma pasta por funcionalidade
│   │   ├── shops/                   F1: configuração, tema, domínios, políticas da barbearia
│   │   ├── haircuts/                F1: catálogo (components, server, schemas, types)
│   │   ├── queue/                   F1 termômetro; F2 fila unificada e espera calculada
│   │   │   ├── display-state.ts     Função pura: validade e rótulos (com teste)
│   │   │   └── wait-estimate.ts     F2: função pura
│   │   ├── auth/                    F1: sessão, papéis (dono, barbeiro)
│   │   ├── barbers/                 F2: perfil, especialidades, disponibilidade
│   │   ├── booking/                 F2/F3
│   │   │   ├── availability.ts      Função pura: horários livres
│   │   │   ├── state-machine.ts     Função pura: transições e regras de tempo/dinheiro (com teste)
│   │   │   ├── policy.ts            Função pura: sinal, janela, tolerância, atraso, reembolso
│   │   │   └── server/              Queries e actions
│   │   ├── payments/                F3: porta do gateway, adaptador, cobrança Pix, webhook, reembolso
│   │   ├── notifications/           F2: adaptador do BSP, templates, bot restrito, registro de mensagens
│   │   ├── reviews/                 F4
│   │   └── analytics/               F4
│   ├── components/ui/               UI genérica, sem regra de negócio
│   ├── server/
│   │   ├── db/
│   │   │   ├── client.ts            Conexão única, pool limitado, sob demanda
│   │   │   ├── tenant.ts            tenantDb(shopId): único caminho para consultas de negócio
│   │   │   └── schema/              Um arquivo por entidade
│   │   ├── tenant/
│   │   │   └── resolve.ts           getShopByHost(host) com cache curto
│   │   ├── crypto.ts                F3: criptografia de credenciais de gateway
│   │   └── jobs/                    F2: agendador de tarefas (ver D16)
│   └── lib/                         env.ts · logger.ts · cn.ts · money.ts (centavos) · time.ts (UTC ↔ America/Fortaleza)
├── tests/                           Integração entre camadas e isolamento de tenant
├── .env.example
└── package.json  tsconfig.json  eslint.config.mjs  vitest.config.ts  next.config.ts
```

## Responsabilidade por camada

| Camada | Faz | Não faz |
|---|---|---|
| `src/proxy.ts` | Mapeia host → rota do tenant ou da plataforma | Consultar regras de negócio |
| `src/app` | Roteia, compõe, define metadados e boundaries | Regra de negócio, acesso direto ao banco |
| `features/*/components` | Interface da funcionalidade | Importar `src/server/db` |
| `features/*/server` | Queries, Server Actions, autorização, validação | Renderizar UI |
| Funções puras (`display-state`, `availability`, `state-machine`, `policy`, `wait-estimate`) | Regras de tempo e dinheiro | I/O e efeitos colaterais |
| `features/payments`, `features/notifications` | Falar com gateway e BSP por uma porta própria | Conhecer regras de reserva além do contrato |
| `src/server/db` | Cliente, schema e `tenantDb` | Regras de negócio |
| `src/lib` | Utilitários neutros | Depender de features |

Dependência: `app → features → server, lib, components/ui`. Features se falam pelo `index.ts` de cada uma.

## Multi-tenant

- **Resolução:** o host define a barbearia. Subdomínio padrão (`{slug}.plataforma.com.br`) ou domínio próprio. O proxy reescreve para `(tenant)/[domain]`; o layout resolve a barbearia com `getShopByHost`.
- **Isolamento:** toda tabela de negócio tem `shop_id`. Consultas de negócio passam por `tenantDb(shopId)`; consulta sem `shop_id` não existe no código de features. Teste de integração tenta ler e escrever entre barbearias (deve falhar).
- **Defesa em profundidade (F2, quando entram dados pessoais):** Row Level Security do PostgreSQL por `shop_id`, sem substituir a regra da aplicação.
- **Tema:** cores, logo e nome vêm de `shop` e viram variáveis CSS no layout do tenant. Nada de CSS gerado por barbearia no build.
- **Domínios próprios (planos superiores):** o proxy reverso do VPS emite o certificado; o operador confirma o DNS no onboarding. Ver D21 e D22.
- **Webhooks** não têm host de tenant: o `shopId` vai na rota e o segredo é por barbearia.

## Decisões

| # | Decisão | Motivo | Revisitar quando |
|---|---|---|---|
| D1 | Fila: um registro por barbearia (e por barbeiro na F2), atualizado por Server Action | Simples e suficiente | Volume exigir tempo real instantâneo |
| D2 | Polling de 30 s em `/api/fila` | Atende "quase real" com custo mínimo e funciona em qualquer hospedagem | Necessidade de atualização instantânea |
| D3 | Filtros na URL; catálogo no servidor | Compartilhável e performático | — |
| D4 | Modal por intercepting route com fallback | URL própria do corte | Complexidade do slot paralelo atrapalhar |
| D5 | **Revisada:** imagens no Cloudflare R2, com upload pelo painel (detalhes em D23) | Fotos por barbearia não cabem no repositório nem no deploy; também evita fotos de clientes no Git | — |
| D6 | **Revisada:** usuários por barbearia, papéis dono e barbeiro, senha com hash forte, sessão em cookie `httpOnly`. Biblioteca de auth decidida no bootstrap (consultar documentação atual) | Multi-tenant exige contas individuais | — |
| D7 | Validade do termômetro: 120 min, configurável por barbearia | Evita fila velha como atual | Dono ajustar |
| D8 | **Revogada** ("sem dados pessoais"): a partir da F2 há nome e telefone. Aplica-se LGPD | Reserva exige contato | — |
| D9 | Uma base e um banco, `shop_id` em toda tabela, `tenantDb`, RLS na F2 | Decisão 1 do projeto | Cliente exigir isolamento físico |
| D10 | Tenant por host, subdomínio padrão e domínio próprio | Decisão 1 do projeto | — |
| D11 | Reserva no site; WhatsApp só para avisos e fluxos restritos | Decisão 2 do projeto | — |
| D12 | Cada barbearia tem sua conta de gateway. Credenciais por conexão OAuth quando o gateway permitir; caso contrário, chaves criptografadas em repouso (`crypto.ts`). Plataforma nunca retém valores. Um adaptador no início, atrás de uma porta | Decisão 7 do projeto | Segundo gateway for necessário |
| D13 | Webhooks do gateway confirmam pagamentos em todos os planos; nunca confiar no corpo: verificar autenticidade e consultar o pagamento no gateway; idempotência por ID do evento; guardar o evento bruto; rotina de reconciliação | Decisões 7 e 8 | — |
| D14 | Reserva dupla impedida por **restrição de exclusão** no PostgreSQL (barbeiro + intervalo de tempo, para reservas ativas), via migration SQL manual (o Drizzle não gera esse tipo) | Corrida entre requisições | — |
| D15 | WhatsApp pela API oficial via BSP (360dialog Regular, €49 por número ao mês, tarifas da Meta repassadas), número compartilhado, templates de utilidade; número dedicado por barbearia no Premium (F5). Custo por mensagem registrado por barbearia | Decisão 6 e regras da Meta | Regras ou preços da Meta mudarem |
| D16 | **Agendador de tarefas:** executor no próprio VPS (processo de jobs ou cron do servidor chamando `/api/cron/*` protegido por `CRON_SECRET`), com fila persistente, idempotência por reserva e evento, e reagendamento automático quando a reserva muda. Precisão de minutos para T−55, T, T+5 e T+10 | Evitar lembrete atrasado e cancelamento automático errado | Volume exigir fila gerenciada |
| D17 | Datas em UTC; exibição no fuso da barbearia (padrão `America/Fortaleza`) | Evita erro de fuso | — |
| D18 | Valores em centavos inteiros; helper único em `lib/money.ts` | Evita erro de arredondamento | — |
| D19 | Política vigente (valores e versão dos termos) é gravada com cada reserva | Mudar política não altera reservas existentes; prova do que o cliente aceitou | — |
| D20 | **Hospedagem:** VPS próprio com Coolify, hospedando a aplicação, o PostgreSQL e a API. Sem Vercel | Evita latência e exposição do Postgres à internet; agendador com precisão de minutos | Fim do piloto; reavaliar antes da F3 |
| D21 | **Proxy e certificados:** Traefik (padrão do Coolify) para os subdomínios `{slug}.plataforma.com.br` (certificado curinga, exige DNS com API). PoC na Fase 0 de Caddy com certificado sob demanda para domínios próprios, com endpoint de verificação que só autoriza domínios cadastrados. Domínio próprio apenas em planos superiores | Sem o endpoint de verificação, qualquer um aponta domínios ao IP e esgota a emissão | Resultado da PoC |
| D22 | IP fixo (ou proxy como o da Cloudflare) para domínios raiz de clientes | Trocar de VPS não deve exigir que cada barbearia mude o DNS | PoC |
| D23 | **Imagens no Cloudflare R2**, chaves `shops/{shopId}/...`, upload por URL assinada com limite de tipo e tamanho, remoção de EXIF (GPS) e tamanhos gerados no upload. Fotos de cortes e de barbeiros: bucket público. **Fotos de antes/depois de clientes: bucket privado com URL assinada temporária** | Fotos de clientes são dados pessoais e precisam ser apagáveis; o VPS não redimensiona a cada visita | — |
| D24 | **Retenção LGPD:** 12 meses após a última atividade, depois agregação anual e exclusão dos registros individuais; barbearia controladora, plataforma operadora; exclusão sob pedido. Pseudonimização: ver pendência em `business-rules.md` seção 12 | Decisão do projeto | Parecer jurídico |
| D25 | **Backup e recuperação:** arquivamento contínuo de logs do Postgres (PITR), meta de perda de até 15 min e retorno em até 4 h; backup diário criptografado com chave separada, em conta diferente da do VPS; monitoramento externo ao servidor com alerta de "backup não rodou"; teste de restauração mensal no início e trimestral depois; roteiro de recuperação escrito; a restauração reaplica a lista de exclusões LGPD | Backup diário sozinho perde até 24 h de reservas | — |
| D26 | **Painel do Coolify** em servidor separado da produção quando houver receita para isso; até lá, atualizar o Coolify e restringir o acesso ao painel | Ele guarda credenciais e chaves SSH dos servidores | Receita do piloto |
| D27 | Build e testes na integração contínua; o Coolify só faz deploy de imagem. Ambiente de teste separado, com sandbox do gateway e número de teste do BSP | Evita competir por memória com a produção e testar dinheiro real | — |
| D28 | Cookie de sessão restrito ao host (sem `Domain` amplo); sessão guarda `shopId`; toda mutação revalida sessão, papel e barbearia | Evita sessão válida em outra barbearia | — |
| D29 | Chaves de cache sempre incluem `shopId`; respostas públicas com `Vary: Host`; `/api/fila` com cache curto (cerca de 15 s) | Evita vazamento entre barbearias e carga excessiva | — |
| D30 | Lista de slugs reservados; Postgres somente na rede interna; painel do Coolify por VPN ou lista de IPs, com 2FA | Reduz superfície de ataque | — |
| D31 | Imagens enviadas são validadas, reprocessadas no servidor (remove EXIF e conteúdo embutido) e gravadas em tamanhos prontos | Segurança e privacidade | — |
| D32 | VPS em São Paulo, mínimo 4 vCPU, 8 GB de RAM, NVMe, IP fixo e snapshots; provedor definido na Fase 0 pelo menor preço que cumpra a especificação | Latência para Parnaíba e IP estável para domínios próprios | Carga real do piloto |
| D33 | Tarefas agendadas recalculam o estado por função pura e respeitam a tolerância de execução (5 min); atrasadas além disso, não penalizam o cliente; `audit_log` registra ações sensíveis | Falha nossa nunca pune o cliente | — |
| D34 | Autenticação em dois fatores (TOTP) para o dono a partir da Fase 3; redefinição de senha pelo dono (barbeiro) e pelo operador (dono), sem e-mail no início | Dinheiro entra em jogo; evita infraestrutura de e-mail cedo | Necessidade de e-mail |

## Banco de dados (esboço)

Detalhe final sai do schema Drizzle em `src/server/db/schema/`. Todas as tabelas de negócio têm `shop_id`.

**F1**
- `shops`: `id`, `slug`, `name`, `custom_domain`, `theme` (jsonb), `timezone`, `plan`, `opening_hours` (jsonb), `settings` (jsonb: validade da fila, parâmetros de política), `created_at`.
- `users` e `shop_members`: `user_id`, `shop_id`, `role` (`owner` | `barber`), hash de senha.
- `haircuts`: `slug` (único por barbearia), `name`, `description`, `style`, `length`, `hair_types[]`, `maintenance_level`, `estimated_minutes`, `price_cents` (anulável até a F2), `is_active`.
- `haircut_images`: `kind` (`cover` | `example` | `before` | `after`), `url`, `alt`, `sort_order`.
- `queue_status`: `state`, `estimated_wait_minutes`, `updated_at`, `updated_by` (por barbearia; por barbeiro na F2).

**F2**
- `barbers`: `name`, `photo_url`, `specialties[]`, `is_active`; `barber_services` (quem faz qual corte; `price_cents` e `deposit_percent` próprios do barbeiro, dentro da faixa 20–30%); `availability` e `time_off`.
- `customers`: `name`, `phone`, `whatsapp_consent_at`, `opted_out_at`, `last_activity_at`, `anonymized_at` (por barbearia; base da retenção de 12 meses).
- `walk_ins`: `barber_id`, `counted_at`, `customer_id` (anulável: "contar atendimento" é anônimo), `cause`.
- `audit_log`: `actor_id`, `action`, `target`, `reason`, `created_at` (perdão, reversão de check-in, reembolso, mudança de política, acessos do operador).
- `services`/`haircuts` ganham `buffer_minutes`; `bookings` ganha `notice_delivery_status` (entrega do aviso de T−55).
- `bookings`: `presence_confirmation` (`unconfirmed` | `confirmed`), `barber_id`, `haircut_id`, `customer_id`, `starts_at`, `ends_at`, `status`, `cancel_reason`, `price_cents`, `deposit_cents`, `policy_snapshot` (jsonb), `arrived_at`, `started_at`, `completed_at`, `rescheduled_from`, `access_token` (hash). Restrição de exclusão (D14).
- `whatsapp_messages`: `booking_id`, `template`, `category`, `status`, `estimated_cost_cents`.

**F3**
- `gateway_connections`: `provider`, credenciais criptografadas, `status`.
- `payments`: `booking_id`, `gateway_payment_id` (único), `amount_cents`, `status`.
- `payment_events`: `gateway_event_id` (único), `payload`, `processed_at`.
- `refunds`: `payment_id`, `amount_cents`, `status`, `reason`.

**F4**
- `reviews`: `booking_id` (único), `barber_id`, `rating`, `comment`, `status` (moderação).

Índices-chave: `haircuts(shop_id, slug)` único; `haircuts(shop_id, is_active, style, length)`; `bookings(shop_id, barber_id, starts_at)`.

## Variáveis de ambiente (`.env.example`)

| Variável | Fase | Uso |
|---|---|---|
| `DATABASE_URL` | 1 | Conexão PostgreSQL |
| `SESSION_SECRET` | 1 | Assinatura da sessão |
| `PLATFORM_ROOT_DOMAIN` | 1 | Domínio base dos subdomínios |
| `STORAGE_*` | 1 | Cloudflare R2: conta, buckets público e privado, chaves de acesso |
| `CRON_SECRET` | 2 | Protege rotas de tarefas agendadas (executor no VPS, D16) |
| `WHATSAPP_*` | 2 | Credenciais do BSP e segredo do webhook |
| `LLM_*` | 2 | Provedor de IA do bot, com teto de gasto |
| `ENCRYPTION_KEY` | 3 | Criptografia de credenciais de gateway |
| `GATEWAY_*` | 3 | Credenciais da aplicação da plataforma no gateway (se houver OAuth) |

Todas validadas em `src/lib/env.ts`, nunca com prefixo `NEXT_PUBLIC_`. Credenciais de cada barbearia ficam no banco, criptografadas, não em variáveis de ambiente.
