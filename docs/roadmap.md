# Roadmap — Barbearia Web

> Plano de desenvolvimento por fases. Esforço em P/M/G (relativo, não é prazo). Prazos só depois da Fase 0.
> Cada fase começa com brainstorming curto, termina com checks verdes, critérios de aceite do `PRODUCT.md` atendidos e documentos atualizados. Não crie código, tabelas ou pastas de uma fase futura.

## Fase 0 — Alinhamento (P)

**Objetivo:** fechar o que bloqueia a Fase 1 e confirmar demanda real.

- Contratar o VPS (provedor e região) e instalar o Coolify; criar a conta e os buckets do Cloudflare R2.
- **Prova de conceito de domínio e certificado:** subdomínio padrão com Traefik e domínio próprio com Caddy sob demanda e endpoint de verificação; decidir IP fixo ou intermediário.
- **Prova de backup:** arquivamento contínuo do Postgres, backup criptografado em conta separada e restauração testada.
- Conversar com 2 ou 3 barbearias de Parnaíba e fechar o piloto.
- Listar o custo mensal por barbearia (hospedagem, banco, storage, domínio) e confrontar com as projeções financeiras.
- Escolher a barbearia piloto: dono disposto a usar a fila e a agenda, de 1 a 3 barbeiros, já usa WhatsApp com os clientes, aceita medir no-show e dar retorno semanal. Oferecer período reduzido de mensalidade em troca do uso real.
- Formalizar o operador (CNPJ e nota fiscal da mensalidade, com o contador), abrir a conta do BSP (360dialog, plano Regular de €49 por número ao mês) e iniciar a verificação de negócio na Meta; redigir os templates de WhatsApp.
- Definir com o advogado o conjunto mínimo de documentos (termos de uso, acordo de tratamento de dados, política de privacidade, termos do checkout).
- Preencher a tabela de custo por barbearia e calcular o preço mínimo de cada plano (custo medido + margem).
- Rodar o bootstrap do toolkit (prompt 11), incorporando estes documentos.

**Saída:** pendências da Fase 1 resolvidas, PoC de domínio/certificado e de backup concluídas, piloto definido, projeto criado com `npm run check` passando.

## Fase 1 — MVP vendável (G)

**Escopo:** RF-01 a RF-07.

1. Base multi-tenant: schema, `tenantDb`, resolução por host, tema, `scripts/create-shop.ts`.
2. Autenticação com papéis, painel e atualização da fila.
3. Catálogo, filtros, modal e página do corte; gestão de cortes e fotos no painel.
4. Termômetro com validade e polling.
5. Botão de WhatsApp por link e política de privacidade.
6. Página pública da plataforma (planos e contato por WhatsApp), com a identidade de `docs/design.md`.
7. Deploy de produção e domínio do piloto.

**Saída:** barbearia piloto usando em produção; teste de isolamento entre barbearias passando (inclui cache e cookies por host); build na integração contínua e deploy de imagem funcionando; ambiente de teste separado.
**Riscos:** vazamento entre tenants (mitigar com teste de integração desde o início); barbeiro não atualiza a fila (observar no piloto).

## Fase 2 — Agenda e WhatsApp (G)

**Antes de começar:** templates de WhatsApp aprovados. A fila de quem chega sem reserva segue `docs/business-rules.md` (6 e 6.1). O agendador roda no VPS (D16); validar a precisão de minutos.
**Escopo:** RF-08 a RF-14.

1. Barbeiros (foto, especialidades), serviços com preço e duração, disponibilidade e folgas.
2. Reserva sem pagamento, antecedência mínima de 60 min, restrição de exclusão no banco, proteção contra abuso.
3. Fila unificada, espera calculada, ações iniciar, finalizar e "cheguei"; clientes sem reserva com "contar atendimento" e "identificar cliente" e alerta de encaixe que atrasa reserva.
4. WhatsApp: templates aprovados, número compartilhado, registro de custo, opt-in e opt-out.
5. Bot restrito, com teste de recusa fora do escopo.
6. RLS no PostgreSQL; LGPD (consentimento, mascaramento de telefone nos logs, retenção).

**Saída:** reservas reais no piloto; taxa de no-show medida (base para decidir o sinal).
**Riscos:** aprovação de templates demora; reputação do número compartilhado (limitar envio por barbearia); lembrete atrasado se o agendador não tiver precisão.

## Fase 3 — Pix e política de falta (G)

**Antes de começar:** validar com o piloto o percentual padrão do sinal e o desconto de reagendamento por atraso do barbeiro, fechar o prazo fiscal dos registros de pagamento, revisão jurídica dos termos (janela de 50 min, retenção integral, reagendamento, pseudonimização), escolha do gateway, e **backup com restauração testada em produção** (D25) antes de entrar dinheiro.
**Escopo:** RF-15 a RF-18.

1. Conexão do gateway por barbearia, credenciais protegidas.
2. Cobrança Pix, expiração da reserva, confirmação por webhook verificado e idempotente.
3. Linha do tempo T−55, T−50, T, T+5 e T+10; reembolso, retenção, tolerância, cancelamento automático sem check-in e atraso do barbeiro, com testes de borda de tempo e valor.
3a. Alerta ao barbeiro em T+5 por painel e PWA.
4. Rotina de reconciliação com o gateway; alerta quando o reembolso falha.
5. Termos no checkout, versionados e gravados com a reserva.

**Saída:** fluxo completo testado com dinheiro real em valor baixo; revisão de segurança concluída.
**Riscos:** disputa com cliente (mitigar com termos claros e log de eventos); barbearia sem saldo para reembolsar.

## Fase 4 — Planos e dados (M)

**Antes de começar:** fechar a matriz de planos, a fórmula do índice e a regra das avaliações. Brainstorming completo.
**Escopo:** RF-19 a RF-22.

1. Feature flags por plano, aplicadas no servidor.
2. Avaliações verificadas e moderação.
3. Estatísticas e índice de saúde.
4. Indicadores financeiros do Premium, rotulando valores estimados.
5. Cobrança recorrente automática da manutenção mensal e da implantação, pela conta do operador (no piloto pode seguir manual).

**Saída:** pelo menos uma barbearia em plano pago.

## Fase 5 — Operação (M)

**Escopo:** RF-23 a RF-25.

1. Número dedicado como add-on pago do Premium (cadastro do número no BSP).
2. Painel do operador: criar barbearia, plano, custos e saúde das integrações.
3. Checklist de onboarding repetível e rotina de offboarding.
4. Contratação self-service (cadastro, aceite do contrato, pagamento da implantação, criação automática da barbearia e onboarding guiado).
5. Monitoramento externo, rotina recorrente de teste de restauração, roteiro de recuperação e painel do Coolify em servidor separado (D25, D26). O backup básico já existe desde a Fase 3.

**Saída:** segunda e terceira barbearias entram sem mexer no código.

## Em todas as fases

- Regras de tempo e dinheiro em funções puras com teste, incluindo valores de borda.
- Revisão de segurança antes de concluir as fases 2 e 3 (isolamento de tenant, pagamentos, webhooks, segredos).
- Custo por barbearia medido e comparado com o preço do plano.
- Prompt 12 do toolkit (adoção em projeto existente) quando houver código da Fase 1 em produção.

## Custo por barbearia (preencher na Fase 0)

| Item | Valor mensal | Fonte |
|---|---|---|
| VPS (parcela por barbearia) | — | — |
| Backup off-site | — | — |
| Cloudflare R2 (imagens) | — | — |
| Domínio | — | — |
| BSP do WhatsApp (360dialog Regular, €49 por número ao mês) | €49 por número | documentação do 360dialog |
| Mensagens de WhatsApp (utilidade, por mensagem entregue; 3 por reserva no fluxo normal) | — | — |
| IA do bot | — | — |
| **Total** | — | — |

## Gates e regras de decisão (sem pendências)

- **Piloto:** barbearia de Parnaíba com dono disposto, 1 a 3 barbeiros, uso diário de WhatsApp e aceite do termo de piloto (90 dias, 50% de desconto, relatório semanal, saída sem multa). A primeira que cumprir é a escolhida.
- **VPS:** três cotações; vence o menor preço que cumpra D32, com snapshot automático e IPv4 fixo incluídos.
- **Preços:** Base R$ 200 de implantação e R$ 60 por mês; Premium (completo) R$ 400 e R$ 80 por mês, com franquia de 100 reservas por mês. Excedente e número dedicado a custo mais 20%. A margem mínima de 40% é meta a partir de 25 barbearias ativas; revisão trimestral. Variação do euro e das tarifas da Meta repassada com aviso de 30 dias (cláusula do contrato).
- **Revisão aos 90 dias do piloto:** sinal padrão, percentuais de retenção, desconto por atraso, pesos do índice.
- Gates de liberação completos: `PRODUCT.md`, seção 15.
