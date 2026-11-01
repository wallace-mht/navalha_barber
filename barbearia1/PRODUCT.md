# Barbearia Web — PRODUCT

> Fonte de verdade de produto e escopo. Mudanças de escopo atualizam este arquivo antes do código.
> Status: v3 — escopo e política refinados após as decisões da seção 14 (itens 9 a 22).
> **[DECIDIDO]** = valor final, configurável. **[GATE]** = verificação obrigatória antes de a fase entrar em produção, com padrão já decidido (seção 15).
> Regras detalhadas de reserva, sinal e atraso: `docs/business-rules.md`. Fases e entregas: `docs/roadmap.md`.

## 1. Visão geral

Plataforma web (mobile-first) vendida a barbearias de Parnaíba (PI). Cada barbearia recebe um site próprio, com domínio e tema personalizados, que mostra o catálogo de cortes e o estado da fila presencial. Nos planos superiores, o cliente escolhe o barbeiro, reserva um horário pagando um sinal via Pix e recebe confirmações e lembretes pelo WhatsApp.

Uma única base de código e um único banco atendem todas as barbearias (multi-tenant, isolamento por ID da barbearia).

## 2. Problema

- O cliente não consegue ver o resultado de um corte antes de chegar e descreve o que quer de forma imprecisa.
- O cliente não sabe quanto tempo vai esperar e precisa interromper o barbeiro para perguntar.
- A barbearia perde dinheiro com faltas e atrasos, e o barbeiro fica ocioso quando o cliente não aparece.

## 3. Público e personas

| Persona | Quem é | O que precisa |
|---|---|---|
| **Cliente final** | Frequentador da barbearia, quase sempre no celular | Escolher corte e barbeiro, saber a espera, reservar e ser avisado |
| **Barbeiro** | Profissional que atende | Atualizar a fila e a agenda em poucos toques, sem atrapalhar o atendimento |
| **Dono da barbearia** (cliente pagante) | Contrata o plano | Configurar barbeiros, serviços, políticas e gateway; ver indicadores (Premium) |
| **Operador da plataforma** | Quem vende e mantém o sistema | Cadastrar barbearias, acompanhar custos, dar suporte |

## 4. Modelo de negócio

- Venda do site com **manutenção mensal fixa**, em planos de Base a Premium.
- A plataforma **não retém valores**: cada barbearia recebe os sinais direto na própria conta de gateway.
- Custos recorrentes por barbearia (infraestrutura, banco, armazenamento de imagens, WhatsApp, IA) devem ser medidos desde a Fase 1 para sustentar o preço dos planos.
- Projeções financeiras: estimativas teóricas, só para orientar o escopo. **Os preços dos planos abaixo são os valores decididos** (Base: R$ 200 de implantação e R$ 60 por mês; Premium: R$ 400 e R$ 80 por mês); revisados a cada trimestre com o custo medido por barbearia (meta de margem de 40% a partir de 25 barbearias ativas).

### Modelo SaaS e planos **[DECIDIDO]**

A Barbearia Web é um **SaaS multi-tenant**: cada barbearia assina, recebe seu próprio site (subdomínio ou domínio próprio, tema e logo) e usa o painel, tudo na mesma base de código. Cobrança em duas partes: **implantação única** e **manutenção mensal**. Há dois planos: **Base** e **Premium (completo)**.

| | Base | Premium (completo) |
|---|---|---|
| Implantação (única: site, tema, catálogo inicial) | R$ 200 | R$ 400 |
| Manutenção mensal | R$ 60 | R$ 80 |
| Site com subdomínio padrão e tema próprio | ✓ | ✓ |
| Catálogo de cortes, modal antes/depois e termômetro de fila | ✓ | ✓ |
| Painel do barbeiro (fila) e botão "chamar no WhatsApp" (link simples) | ✓ | ✓ |
| Domínio próprio (o registro do domínio é por conta da barbearia) | — | ✓ |
| Múltiplos barbeiros, agenda e escolha do barbeiro | — | ✓ |
| Reserva com sinal via Pix e política de falta | — | ✓ |
| WhatsApp (número compartilhado): confirmação, lembretes e avisos | — | ✓ (100 reservas por mês incluídas) |
| Avaliações verificadas de barbeiros | — | ✓ |
| Estatísticas, índice de saúde e indicadores financeiros | — | ✓ |

**Cobrados à parte, a custo mais 20%** (descritos no contrato): reservas acima da franquia de 100 por mês (custo das mensagens de WhatsApp) e número de WhatsApp dedicado (€49 por número ao mês pelo câmbio de referência de R$ 6,00 por euro, atualizado a cada trimestre, mais as mensagens).

**Conta de margem (estimativa do operador, revisada a cada trimestre):** o custo por barbearia é composto por parcela do VPS e do backup, R2, teto de IA do bot e parcela do número compartilhado (€49 ≈ R$ 300 divididos entre as barbearias). A partir de cerca de 25 barbearias ativas o Premium de R$ 80 cobre o custo com a margem mínima de 40%. Antes disso, o piloto e as primeiras barbearias fecham perto do ponto de equilíbrio, e a implantação (R$ 200 e R$ 400) e o repasse do excedente sustentam o caixa. O Base não usa WhatsApp pago.

## 5. Princípios

1. O cliente resolve tudo em até 3 toques a partir da home.
2. O barbeiro executa no máximo 2 ações durante o atendimento: **iniciar** e **finalizar**.
3. Informação desatualizada é pior que nenhuma: o sistema deixa claro quando um dado está velho.
4. Regras de dinheiro e de tempo são determinísticas, claras ao cliente antes do pagamento e cobertas por teste.
5. Cada barbearia vê apenas os seus próprios dados, sempre.
6. Entregar em fases; vender a partir da Fase 1.

## 6. Fluxos principais

- **F1 — Descobrir um corte:** home com filtros combináveis refletidos na URL.
- **F2 — Ver detalhes:** modal com descrição, fotos e antes/depois; URL própria e compartilhável.
- **F3 — Consultar a fila:** termômetro por barbearia (e por barbeiro quando houver), com carimbo de atualização e regra de validade.
- **F4 — Barbeiro atualiza a fila:** painel autenticado, controles de toque rápido.
- **F5 — Reservar:** o cliente escolhe corte, barbeiro e horário no site, informa nome e telefone, aceita a política, paga o sinal via Pix e recebe a confirmação na tela e no WhatsApp.
- **F6 — Confirmar e lembrar:** a plataforma pede confirmação antes da janela de cancelamento e envia lembrete perto da hora.
- **F7 — Chegar e ser atendido:** "cheguei" pelo WhatsApp ou marcação do barbeiro; iniciar e finalizar; tolerância e encaixe.
- **F8 — Cancelar ou remarcar:** reembolso do sinal conforme a janela de cancelamento.
- **F9 — Atraso do barbeiro:** acima de 15 min, o cliente escolhe reembolso integral do sinal ou reagendamento com desconto.
- **F10 — Onboarding de barbearia (operador):** criar barbearia, tema, domínio, barbeiros, conexão com o gateway, número de WhatsApp.

## 7. Escopo por fase

| Fase | Resumo |
|---|---|
| **1. MVP vendável** | Multi-tenant (domínio, tema, isolamento), catálogo com filtros, modal, termômetro, painel com login por barbearia, gestão de cortes e fotos, botão de WhatsApp por link |
| **2. Agenda e WhatsApp** | Barbeiros (foto, especialidades), serviços com preço e duração, disponibilidade, reserva sem pagamento, fila unificada, WhatsApp via número compartilhado, bot restrito |
| **3. Pix e política** | Sinal de 20–30% via gateway da barbearia, webhooks, reembolso, tolerância, no-show, atraso do barbeiro |
| **4. Planos e dados** | Feature flags por plano, avaliações verificadas, estatísticas, índice de saúde, indicadores financeiros (Premium) |
| **5. Operação** | Número dedicado (Premium), painel da plataforma, onboarding repetível, offboarding, monitoramento |

## 8. Requisitos funcionais

### Fase 1
- **RF-01 Multi-tenant:** cada barbearia é resolvida pelo domínio (subdomínio padrão ou domínio próprio); tema (cores, logo, nome) por barbearia; toda leitura e escrita é limitada à barbearia atual.
- **RF-02 Catálogo:** cortes ativos em cards, com filtros combináveis (estilo, comprimento, tipo de cabelo) refletidos na URL. O dono cria, edita e desativa cortes e fotos no painel.
- **RF-03 Modal do corte:** descrição, tags, duração estimada, galeria e par antes/depois; acessível; rota própria `/cortes/[slug]`.
- **RF-04 Termômetro:** estados Sem fila, Fila normal, Fila cheia, Pausa/Fechado; espera em minutos; carimbo de atualização; validade de 2 h (configurável por barbearia); atualização do cliente a cada 30 s; horário de funcionamento por barbearia alimenta o estado "Fechado"; o termômetro da barbearia mostra a menor espera entre os barbeiros em atividade.
- **RF-05 Painel:** login por barbearia com papéis (dono, barbeiro); atualização da fila.
- **RF-06 WhatsApp por link:** botão que abre conversa com a barbearia (sem API, sem custo por mensagem).
- **RF-07 Privacidade básica:** política de privacidade publicada; nenhum dado pessoal de cliente final coletado nesta fase.

### Fase 2
- **RF-08 Barbeiros:** perfil com foto, nome e especialidades; o cliente escolhe o profissional.
- **RF-09 Serviços:** corte com preço e duração.
- **RF-10 Disponibilidade:** horários de trabalho, pausas e folgas por barbeiro; geração de horários livres.
- **RF-11 Reserva sem pagamento:** nome, telefone e consentimento; antecedência mínima de 60 min; proteção contra reserva dupla e contra abuso.
- **RF-12 Fila unificada:** reservas e clientes sem hora marcada na mesma fila; espera calculada pela duração dos serviços à frente, com ajuste manual do barbeiro; ações iniciar, finalizar e "cheguei".
- **RF-12a Clientes sem reserva:** atendimento a critério do barbeiro; registro opcional em duas ações, "contar atendimento" (1 toque, anônimo) e "identificar cliente" (nome e telefone com consentimento); alerta quando um encaixe atrasa a próxima reserva; o painel mostra a cobertura dos dados.
- **RF-13 WhatsApp compartilhado:** confirmação, aviso de T−55 e aviso de T por templates de utilidade; toda mensagem identifica a barbearia; opt-out respeitado. O silêncio no aviso de T−55 mantém a reserva como "Não confirmado".
- **RF-14 Bot restrito:** fluxos estruturados (confirmar, cancelar, remarcar, "cheguei", dúvidas da barbearia); IA só interpreta a intenção; tudo fora do contrato vai para um humano.

### Fase 3
- **RF-15 Sinal via Pix:** 20–30% do valor do serviço (proporcional ao preço do corte praticado pelo barbeiro; o dono define o padrão de 20% e o barbeiro ajusta dentro da faixa), cobrado no checkout na conta de gateway da própria barbearia, com valor exato exibido antes do pagamento; o sinal é abatido do preço; sem parcelamento e sem taxas fora das regras de reagendamento e no-show.
- **RF-16 Webhooks de pagamento:** confirmam o pagamento e a reserva em **todos os planos com reserva**; verificados, idempotentes e reconciliados.
- **RF-17 Reembolso, cancelamento e reagendamento:** cancelamento e reagendamento até T−50 (crédito total do sinal); remarcação depois de T−50 com taxa reduzida (retenção de parte do sinal, que o barbeiro pode dispensar ou reduzir); retenção do sinal no cancelamento tardio; sinal reforçado na reserva seguinte a um no-show; regras em `docs/business-rules.md`.
- **RF-18 Tolerância e atraso:** tolerância de 10 min para o cliente; sem check-in, alerta ao barbeiro em T+5 (painel e PWA) e cancelamento automático em T+10 com retenção do sinal (`noShowRetentionPercent`, padrão 100%, estorno automático do restante); o barbeiro pode perdoar o atraso ou atender como encaixe (sempre mais brando, nunca mais duro); atraso do barbeiro acima de 15 min dá direito a reembolso integral do sinal ou reagendamento com desconto. Linha do tempo completa em `docs/business-rules.md`.

### Fase 4
- **RF-19 Avaliações:** só quem concluiu um atendimento avalia o barbeiro; uma avaliação por atendimento.
- **RF-20 Planos:** recursos liberados por plano (feature flags por barbearia).
- **RF-21 Estatísticas e índice de saúde (Premium):** quatro pilares (ocupação, taxa de no-show, retenção de clientes, pontualidade do barbeiro), com indicação da cobertura de registro.
- **RF-22 Indicadores financeiros (Premium):** derivados dos eventos do gateway e dos atendimentos concluídos.

### Fase 5
- **RF-23 Número de WhatsApp dedicado (add-on pago do Premium).**
- **RF-24 Painel da plataforma:** criar barbearia, acompanhar plano, custos e saúde das integrações.
- **RF-25 Offboarding:** exportar e apagar dados de uma barbearia que encerra o contrato.

## 9. Fora do escopo por enquanto

- Conta ou login de cliente final (a reserva usa nome, telefone e link com token).
- Pagamento integral antecipado, cartão de crédito, split de pagamento ou qualquer retenção de valores pela plataforma.
- Cobrança de multa além do sinal ("multa" significa só a retenção do sinal).
- Marketing e promoções por WhatsApp.
- Aplicativo nativo.
- Várias unidades por barbearia (decidido: cada unidade é uma barbearia separada, com plano próprio).

## 10. Modelo de dados conceitual

Resumo; o esboço completo está em `docs/architecture.md`.

`shop` · `shop_member` · `haircut` · `haircut_image` · `queue_status` · (Fase 2) `barber`, `availability`, `customer`, `booking`, `whatsapp_message` · (Fase 3) `payment`, `payment_event`, `refund`, `gateway_connection` · (Fase 4) `review`.

## 11. Requisitos não funcionais

- Mobile-first, funcional desde 360 px. Interface em português do Brasil. Fuso padrão `America/Fortaleza`, gravando datas em UTC.
- Catálogo renderizado no servidor; imagens otimizadas; boa performance em 4G.
- Acessibilidade WCAG 2.2 AA como alvo.
- Fila visível ao cliente em até 30 s.
- Segurança: isolamento entre barbearias testado; segredos criptografados; entradas validadas no servidor; webhooks autenticados.
- Infraestrutura: VPS com Coolify (aplicação, PostgreSQL e API) e Cloudflare R2 para imagens, sem Vercel. Backup contínuo (PITR) com meta de perda de até 15 min e retorno em até 4 h; monitoramento externo; restauração testada (ver `docs/architecture.md`, D20 a D26).
- Disponibilidade: o contrato de manutenção deve dizer a expectativa de disponibilidade (servidor único).

## 12. Restrições

- **Multi-tenant:** nenhuma consulta de negócio sem o filtro da barbearia; vazamento entre barbearias é falha crítica.
- **Dinheiro:** valores em centavos; a plataforma não segura nem repassa valores; nenhuma taxa pelo ato de agendar: o sinal é parte do preço do serviço.
- **CDC:** a política de sinal, cancelamento e retenção é exibida antes do pagamento, aceita pelo cliente e guardada com a reserva. Validação jurídica antes da Fase 3.
- **LGPD:** a barbearia é controladora e a plataforma é operadora; consentimento no checkout, opt-out de WhatsApp, retenção de 12 meses após a última atividade (depois agregação e exclusão dos registros individuais), exclusão sob pedido, telefone mascarado em logs. Pseudonimização: ver pendência em `docs/business-rules.md`.
- **WhatsApp:** somente a API oficial via BSP; bot restrito a funções de negócio (a Meta proíbe assistentes de propósito geral); somente templates de utilidade; sem marketing.
- **Fotos de clientes** (antes/depois) exigem autorização de uso de imagem registrada pela barbearia.
- Publicação, custos novos e envio de mensagens a terceiros dependem de autorização do operador da plataforma.

## 13. Critérios de aceite

### Fase 1
- [ ] Acessar o domínio de uma barbearia mostra somente os dados e o tema dela; domínio desconhecido retorna 404.
- [ ] Teste automatizado prova que o usuário de uma barbearia não lê nem altera dados de outra.
- [ ] Filtros combinam em "E", ficam na URL e reproduzem o mesmo resultado ao recarregar; estado vazio oferece "Limpar filtros".
- [ ] Modal abre com descrição, galeria e antes/depois; `Esc`, botão e clique fora fecham; foco retorna ao card; `/cortes/[slug]` abre a página completa; slug inexistente retorna 404.
- [ ] Termômetro mostra estado, espera e "atualizado há X min"; sem atualização acima da validade mostra "Status não atualizado" e oculta minutos; Pausa/Fechado não mostra espera.
- [ ] Barbeiro autenticado altera a fila em até 3 toques; cliente vê a mudança em até 30 s; usuário sem sessão é rejeitado; valores inválidos são rejeitados no servidor.
- [ ] O dono cria, edita e desativa cortes e fotos pelo painel; toda imagem tem texto alternativo.
- [ ] `npm run check` passa e as telas principais abrem sem erro no console, com navegação por teclado completa.

### Fase 2
- [ ] O cliente escolhe barbeiro e horário; dois clientes não conseguem o mesmo horário do mesmo barbeiro, mesmo em requisições simultâneas.
- [ ] A espera exibida considera as reservas e a duração dos serviços; o barbeiro realiza iniciar e finalizar com um toque cada.
- [ ] Confirmação e lembrete chegam por template aprovado, identificam a barbearia e respeitam opt-out; respostas por botão vinculam-se à reserva certa mesmo se o cliente tem reservas em outras barbearias.
- [ ] O bot recusa e encaminha a um humano qualquer pedido fora dos fluxos permitidos.
- [ ] Telefone aparece mascarado nos logs.

### Fase 3
- [ ] A reserva só vira "confirmada" depois do pagamento confirmado pelo gateway; reserva não paga expira e libera o horário.
- [ ] Evento de webhook repetido ou fora de ordem não duplica pagamento nem reembolso; evento sem autenticação válida é rejeitado.
- [ ] Reembolso e retenção seguem a janela vigente na hora da reserva (política guardada com a reserva).
- [ ] Atraso do barbeiro acima de 15 min oferece reembolso integral ou reagendamento com desconto; falha de reembolso fica visível e alerta a barbearia.
- [ ] Toda regra de tempo e de dinheiro tem teste com datas e valores de borda.

### Fases 4 e 5
Critérios detalhados ao iniciar cada fase, depois do brainstorming dela.

## 14. Decisões registradas

| # | Decisão | Fase |
|---|---|---|
| 1 | Base de código e banco compartilhados, isolamento por ID da barbearia, domínio e tema por barbearia | 1 |
| 2 | Reserva pelo site com checkout Pix; WhatsApp só para confirmações, lembretes e avisos | 2–3 |
| 3 | Sinal de 20% a 30% do valor do serviço, cobrado no checkout Pix, com reembolso antes da janela de cancelamento | 3 |
| 4 | Tolerância de 10 min para o cliente; atraso do barbeiro acima de 15 min dá reembolso de 100% do sinal ou reagendamento com desconto | 3 |
| 5 | Múltiplos barbeiros por barbearia; o cliente escolhe pelo perfil (fotos, especialidades e avaliações) | 2 e 4 |
| 6 | WhatsApp com número compartilhado da plataforma; número dedicado como add-on pago do Premium | 2 e 5 |
| 7 | Cada barbearia recebe direto na própria conta de gateway | 3 |
| 8 | Webhooks do gateway alimentam os indicadores financeiros do Premium, sem retenção de valores (os mesmos webhooks confirmam pagamentos em todos os planos) | 3–4 |
| 9 | Índice de saúde com quatro pilares: ocupação, taxa de no-show, retenção, pontualidade do barbeiro | 4 |
| 10 | Linha do tempo: confirmação ao pagar; aviso de T−55 (confirmar ou cancelar em 5 min); aviso em T; alerta ao barbeiro em T+5; cancelamento automático com retenção do sinal em T+10 sem check-in | 3 |
| 11 | Silêncio no aviso de T−55 mantém a reserva como "Não confirmado"; atraso do cliente = ausência de check-in | 3 |
| 12 | Reservas só com 60 min ou mais de antecedência | 2 |
| 13 | "Multa" = somente a retenção do sinal | 3 |
| 14 | Walk-ins a critério do barbeiro; registro dividido em "contar atendimento" e "identificar cliente"; alerta de encaixe que atrasa reserva | 2 |
| 15 | Hospedagem: VPS com Coolify, sem Vercel | 0–1 |
| 16 | Traefik para subdomínios; PoC de Caddy sob demanda na Fase 0; domínio próprio só em planos superiores | 0 e 5 |
| 17 | Imagens no Cloudflare R2; fotos de antes/depois em bucket privado com URL assinada, sem EXIF, chaves por barbearia | 1–2 |
| 18 | Projeções financeiras são estimativas teóricas | 0 |
| 19 | LGPD: barbearia controladora, plataforma operadora; retenção de 12 meses após a última atividade | 2 |
| 20 | Backup com PITR (perda até 15 min), diário criptografado off-site em conta separada, monitoramento externo, teste de restauração, roteiro escrito | 3 e 5 |
| 21 | Aviso ao barbeiro por painel e notificação PWA | 3 |
| 22 | Painel do Coolify em servidor separado quando houver receita | 5 |
| 23 | BSP do WhatsApp: 360dialog, plano Regular de €49 por número ao mês (confirmado na documentação do provedor), mais tarifas por mensagem da Meta repassadas sem margem do BSP. Um número compartilhado no início; reavaliar o plano de parceiros quando houver 5 ou mais números | 2 |
| 24 | No-show: o sistema retém uma parte configurável do sinal (padrão 100%) e estorna o restante; a reserva seguinte exige sinal reforçado (padrão 30%), abatido do preço | 3 |
| 25 | Reagendamento pelo cliente: crédito total até T−50, uma vez por reserva; depois de T−50 taxa reduzida (padrão: retém 50% do sinal), que o barbeiro pode dispensar ou reduzir, nunca aumentar | 3 |
| 26 | Sinal: proporcional ao preço praticado pelo barbeiro, percentual de 20–30% (padrão 20%) ajustável pelo barbeiro dentro da faixa; exato e fixo no checkout; sem parcelamento | 3 |
| 27 | Check-in depois de T+10: o barbeiro pode atender como encaixe, e o sinal retido é abatido do preço; antes de T+10 pode perdoar o atraso; sempre registrado |  3 |
| 28 | Pseudonimização só durante a retenção de 12 meses; agregados sem identificador | 2 |
| 29 | Cliente com reserva escolhe o barbeiro; cliente sem reserva entra na fila de quem o registra; sem "primeiro disponível" no início | 2 |
| 30 | Índice de saúde: janela de 30 dias, quatro componentes lado a lado, número único só depois de validar pesos; abaixo de 50% de cobertura, "dados insuficientes" | 4 |
| 31 | Domínio próprio incluído no Premium | 1 e 5 |
| 32 | VPS em São Paulo (mínimo 4 vCPU e 8 GB, NVMe, IP fixo, snapshots); build na integração contínua e deploy de imagem pelo Coolify; ambiente de teste separado | 0 e 1 |
| 33 | Gateway: o primeiro adaptador é o Mercado Pago, com conexão OAuth da conta de cada barbearia e webhooks com assinatura. O gate de aceite na sandbox valida cobrança Pix, assinatura, devolução total e parcial e idempotência; se qualquer item falhar, o adaptador é o Asaas | 3 |
| 34 | Aviso de T−55 não entregue: a retenção do sinal vira decisão do barbeiro | 3 |
| 35 | Problemas previstos e soluções registrados em `docs/risks-and-processes.md` | todas |
| 36 | Modelo SaaS com dois planos: Base (R$ 200 + R$ 60 por mês) e Premium completo (R$ 400 + R$ 80 por mês); franquia de 100 reservas por mês no Premium; excedente e número dedicado a custo mais 20% | 1 a 5 |
| 37 | Página pública da plataforma (planos e contato por WhatsApp) já na Fase 1; contratação self-service e cobrança recorrente automática nas fases 4 e 5 | 1, 4 e 5 |
| 38 | Identidade visual futurista baseada no Rota 360: `docs/design.md` e `docs/design-reference.html` | 1 |

## 15. Gates de liberação (padrões já decididos)

Nenhuma questão fica em aberto: cada item abaixo tem o valor ou a escolha padrão decididos e uma verificação obrigatória antes de a fase entrar em produção.

| Gate | Fase | Padrão decidido | Verificação |
|---|---|---|---|
| Jurídico | 3 | Política das seções 4 a 7 de `docs/business-rules.md` (janela de 50 min, retenção parcial e integral, remarcação tardia, sinal reforçado, pseudonimização), termos de uso, acordo de tratamento de dados, política de privacidade | Advogado revisa antes de a Fase 3 ir a produção; ajustes entram por configuração ou texto, sem mudar a arquitetura |
| Contábil | 0 e 4 | Registros de pagamento guardados por 5 anos sem identificação direta; mensalidade com nota fiscal conforme o enquadramento do operador | Contador confirma na Fase 0 |
| Meta e BSP | 2 | CNPJ do operador, conta 360dialog Regular, verificação de negócio, templates de utilidade submetidos já na Fase 0 | Templates aprovados antes da Fase 2 ir a produção |
| Gateway | 3 | Mercado Pago, fallback Asaas (decisão 33) | Checklist de aceite na sandbox |
| VPS | 0 | Menor preço entre 3 cotações que cumpram D32 (região São Paulo, 4 vCPU, 8 GB, NVMe, IP fixo, snapshots) | PoC de domínio, certificado e backup concluídas |
| Piloto | 1 | A primeira barbearia de Parnaíba que cumprir os critérios do `docs/roadmap.md` e assinar o termo de piloto (90 dias, 50% de desconto na mensalidade, relatório semanal, saída sem multa) | Termo assinado |
| Índice e avaliações | 4 | Pesos 30/25/25/20, janela de 30 dias, amostra mínima de 30 atendimentos, 5 avaliações mínimas, 14 dias para avaliar | Revisão aos 90 dias do piloto |
| Preços | 4 | Tabela da seção 4 (Base e Premium) | Revisão trimestral com o custo medido |
