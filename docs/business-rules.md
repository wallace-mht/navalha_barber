# Regras de negócio — reserva, sinal, atraso e fila

> Fonte única das regras de tempo e dinheiro. O código implementa estas regras em funções puras com teste (sem I/O, recebendo `now` como parâmetro).
> **[DECIDIDO]** é valor final e configurável por barbearia. Valores iniciais são revisados aos 90 dias do piloto, sem mudar código. **[GATE]** é uma verificação obrigatória antes de a fase entrar em produção; o valor padrão já está decidido e vale até o gate indicar o contrário.
> Este documento não é aconselhamento jurídico. Gate jurídico: a política é revisada por advogado antes da Fase 3 entrar em produção.
> Notação: **T** = horário marcado da reserva. Todos os prazos abaixo são em **minutos** em relação a T.

## 1. Parâmetros por barbearia

| Parâmetro | Valor | Limites | Status |
|---|---|---|---|
| `depositPercent` (sinal) | padrão 20%, definido pelo dono; o barbeiro pode ajustar o seu dentro da faixa | 20–30% | **[DECIDIDO]**: sinal proporcional ao preço do corte praticado pelo barbeiro, a critério do profissional dentro da faixa. Valor fixo e exato no checkout, gravado na reserva. Sem parcelamento do sinal e sem taxas além das regras 4.5 e 4.6 |
| `minLeadMinutes` (antecedência mínima para reservar) | 60 | fixo no início | **[DECIDIDO]** |
| `confirmationRequestMinutesBefore` (aviso de confirmação) | 55 | fixo no início | **[DECIDIDO]** |
| `cancellationWindowMinutesBefore` (fim do reembolso) | 50 | fixo no início | **[DECIDIDO]**: o aviso de T−55 dá 5 min para cancelar. Gate jurídico antes da Fase 3 |
| `clientToleranceMinutes` | 10 | fixo no início | **[DECIDIDO]** |
| `barberAlertMinutesAfter` (alerta ao barbeiro) | 5 | fixo no início | **[DECIDIDO]** |
| `barberDelayThresholdMinutes` | 15 | fixo no início | **[DECIDIDO]** |
| Compensação por atraso do barbeiro | reembolso de 100% do sinal **ou** reagendamento com desconto | — | **[DECIDIDO]** |
| `rescheduleDiscountPercent` (desconto no reagendamento por atraso do barbeiro) | padrão 10%, definido pelo dono | 5–50% | **[DECIDIDO]** |
| `maxClientReschedules` (remarcações pelo cliente por reserva) | 1 | fixo no início | **[DECIDIDO]** |
| `noShowRetentionPercent` (parte do sinal retida no no-show) | 100% | 50–100% | **[DECIDIDO]** o mecanismo "debita a multa do sinal e estorna o restante"; padrão 100% por coerência com a retenção integral descrita na linha do tempo |
| `lateRescheduleRetentionPercent` (parte do sinal retida em remarcação depois de T−50) | 50% | 10–90% | **[DECIDIDO]** a taxa reduzida; valor inicial 50% |
| `rebookDepositPercent` (sinal da reserva seguinte a um no-show) | 30% | 20–30% | **[DECIDIDO]** a nova taxa de reagendamento, como sinal reforçado e abatido do preço; valor inicial 30% |
| `holdMinutes` (reserva aguardando Pix) | 10 min | 5–15 | **[DECIDIDO]** |
| `lateCancelRetentionPercent` (parte do sinal retida no cancelamento depois de T−50) | 100% | 50–100% | **[DECIDIDO]** |
| `queueStaleAfterMinutes` (validade do termômetro) | 120 min | 30–480 | **[DECIDIDO]** |
| Retenção de dados pessoais | 12 meses após a última atividade | — | **[DECIDIDO]**; ver seção 12 |

A política vigente no momento da reserva (valores, prazos, texto e versão dos termos) é **gravada com a reserva**. Mudar a configuração depois não altera reservas existentes.

"Multa" neste projeto significa **somente a retenção do sinal já pago**. Não existe cobrança adicional. Use "retenção do sinal" nos termos, na interface e no código.

## 2. Estados da reserva

`pending_payment` → `confirmed` → `arrived` → `in_progress` → `completed`

Saídas laterais: `expired` (Pix não pago no `holdMinutes`), `cancelled` (com motivo), `no_show`.

- `cancelled.reason`: `customer_within_window` (reembolso), `customer_late` (sinal retido), `rescheduled_late` (remarcação tardia, retenção parcial), `shop` (reembolso ou reagendamento), `barber_delay` (reembolso ou reagendamento), `auto_no_checkin` (cancelamento automático em T+10, sinal retido).
- `no_show`: reserva cancelada automaticamente por falta de check-in (4.5). O barbeiro pode reativá-la como encaixe (4.4); a reativação fica registrada (quem, quando).
- Sinalizador de presença, separado do estado: `presence_confirmation` = `unconfirmed` (padrão) | `confirmed` (respondeu "vou" no aviso de T−55).
- `refund_status`: `not_applicable`, `pending`, `done`, `failed`.
- Reagendamento cria uma nova reserva ligada à anterior (`rescheduled_from`).
- Na Fase 2 (sem pagamento) a reserva nasce `confirmed`, sem sinal.

## 3. Criação e pagamento

1. O cliente escolhe serviço, barbeiro e horário, informa nome, telefone e consentimento. **Só são oferecidos horários em que `agora + holdMinutes + 60 min ≤ T`**: o cliente tem no mínimo 60 min entre o pagamento confirmado e o horário (`minLeadMinutes`), e o aviso de T−55 sempre vem depois da confirmação. Pix confirmado depois do prazo de retenção segue a regra de pagamento tardio (seção 13).
2. O sistema retém o horário por `holdMinutes` e gera a cobrança Pix na conta de gateway **da barbearia**.
3. Quando o gateway confirma o pagamento (webhook verificado), a reserva vira `confirmed`. Sem confirmação no prazo, vira `expired` e o horário é liberado.
4. O valor do sinal = `depositPercent` aplicável (o do barbeiro, dentro de 20–30%) do preço do serviço **praticado por aquele barbeiro**, em centavos, arredondado para cima. O sinal é **abatido do preço**; nunca é taxa de agendamento. Reserva que segue um no-show usa `rebookDepositPercent`.
5. Um horário de um barbeiro só pode ter uma reserva ativa (restrição no banco, não só na aplicação).

## 4. Regras de tempo

### 4.1 Linha do tempo de uma reserva

| Quando | Evento | Canal |
|---|---|---|
| Ao confirmar o Pix | Confirmação da reserva com os termos resumidos | Tela + WhatsApp |
| **T−55** | Lembrete e validação: "confirme que vai ou cancele nos próximos 5 minutos; depois disso, cancelar retém o sinal e remarcar retém parte dele" | WhatsApp |
| **T−50** | Fim da janela de cancelamento com reembolso | — |
| **T** | Aviso de que a tolerância de 10 min está correndo | WhatsApp |
| **T+5** | Se não houver check-in: alerta ao barbeiro | Painel + notificação PWA |
| **T+10** | Se não houver check-in: cancelamento automático com retenção do sinal (`no_show`) | Painel + WhatsApp ao cliente |

São **3 disparos de WhatsApp** por reserva no fluxo normal, além de mensagens de evento (cancelamento, reembolso, atraso do barbeiro, remarcação).

### 4.2 Aviso de T−55
- "Vou" marca `presence_confirmation = confirmed`. "Não vou" abre o cancelamento dentro das regras (ainda dentro da janela, com reembolso).
- **O silêncio mantém a reserva válida** e marca "Não confirmado". O barbeiro vê esse status no painel. Silêncio nunca cancela nem retém o sinal.

### 4.3 Chegada (check-in)
- O cliente responde "cheguei" no WhatsApp ou o barbeiro marca a chegada. A reserva vira `arrived` e `arrived_at` é gravado.

### 4.4 Tolerância do cliente (10 min) e cancelamento automático
- "Atraso do cliente" significa **ausência de check-in**. Cliente com check-in nunca é penalizado pela demora do barbeiro nem pela inatividade dele.
- Em T+5 sem check-in o barbeiro recebe o alerta. Nada é retido antes de T+10: o barbeiro não pode reter o sinal antes do fim da tolerância.
- **O barbeiro só pode ser mais brando, nunca mais duro que os termos.** Antes de T+10 ele pode **perdoar** o atraso (manter a reserva ativa, interrompendo o cancelamento automático). A ação fica registrada (quem, quando) e o cliente é avisado.
- Em T+10 sem check-in a reserva é cancelada automaticamente (`auto_no_checkin`) e o sinal é retido, conforme os termos aceitos no checkout.
- Passados os 10 min, o barbeiro pode **encaixar** outro cliente sem culpa.
- **Cliente que chega depois de T+10 (reserva já cancelada):** não tem direito ao atendimento. Se o barbeiro **optar** por atendê-lo (barbeiro livre ou como próximo da fila), usa a ação "atender como encaixe": a reserva é reativada, o sinal retido passa a ser **abatido do preço** (o serviço foi prestado, então o sinal volta a ser parte do preço) e não há segundo pagamento nem taxa. Sem essa ação, vale a retenção conforme `noShowRetentionPercent`. Abatimento incide sobre a parte retida. **[DECIDIDO pelo critério: mais brando, sem cobrança dupla]**

### 4.5 No-show
- No-show = cancelamento automático em T+10 sem check-in (4.4), ou marcação do barbeiro. **O sistema retém `noShowRetentionPercent` do sinal (padrão 100%) e estorna automaticamente o restante**, se houver, conforme os termos aceitos no checkout. A retenção é a única consequência ("multa" = retenção do sinal), e o estorno do restante segue as regras de reembolso da seção 5.
- A regra é aplicada por função pura, não pelo bot. O bot de IA só interpreta a intenção do cliente; ele não decide valores.
- **Nova taxa de reagendamento após o no-show:** o cliente é avisado de que o horário pode ser realocado e pode reservar de novo. A nova reserva exige o sinal reforçado `rebookDepositPercent` (padrão 30%, dentro da faixa 20–30%), **abatido do preço** se ele comparecer e retido se faltar de novo. O sinal retido do no-show anterior não vira crédito. Não existe cobrança de valor fora da faixa do sinal.

### 4.6 Cancelamento e reagendamento pelo cliente
- Cancelar até T−50: reembolso integral do sinal.
- Cancelar depois de T−50: o sinal é retido, conforme os termos aceitos no checkout.
- **Reagendar até T−50:** crédito total. O sinal já pago é transferido para a nova reserva (`rescheduled_from`), sem taxa. A nova reserva respeita a antecedência mínima de 60 min e vale `maxClientReschedules` vezes por reserva. Diferença de valor do sinal (se o serviço mudar) é paga por novo Pix ou reembolsada.
- **Reagendar depois de T−50 e antes de T (os 40 minutos finais incluídos):** taxa reduzida. O sistema retém `lateRescheduleRetentionPercent` do sinal (padrão 50%) e transfere o restante como crédito para a nova reserva. O remarcar nessa faixa precisa da aceitação do barbeiro, que "aplica" a taxa: ele pode **dispensá-la ou reduzi-la** (mais brando, registrado em `audit_log`), nunca aumentá-la nem inventar outro valor. A faixa vale desde T−50, sem buraco entre T−50 e T−40.
- **Cancelar** (não remarcar) depois de T−50 retém `lateCancelRetentionPercent` do sinal (padrão 100%) e estorna o restante, conforme os termos.
- A remarcação tardia só existe entre T−50 e T. Depois de T vale a tolerância e o no-show (4.4 e 4.5).

### 4.7 Atraso do barbeiro (15 min) e reagendamento
- O atraso é medido a partir do **maior** entre T e `arrived_at`. Se o atendimento não começar em 15 min, o cliente recebe a opção de:
  - reembolso de 100% do sinal; ou
  - reagendamento com desconto (`rescheduleDiscountPercent`).
- A opção é acionada pelo próprio cliente (link na mensagem ou no site), nunca decidida pelo barbeiro.
- Quem escolhe reagendar mantém o sinal como crédito na nova reserva e recebe `rescheduleDiscountPercent` de desconto no preço do novo atendimento. "Crédito total" nesta regra e em 4.6 significa o sinal inteiro transferido; o desconto é adicional e só existe por culpa do barbeiro.

### 4.8 Cancelamento pela barbearia
- Reembolso integral do sinal ou reagendamento, à escolha do cliente.

## 5. Reembolso

- O reembolso sai da conta de gateway da barbearia. Se a conta não tem saldo, o reembolso fica `failed`, o cliente é avisado e a barbearia recebe alerta para resolver; nada fica silencioso.
- Reembolsos e eventos são idempotentes (a mesma operação nunca devolve duas vezes).

## 6. Fila, espera e clientes sem reserva

- Reservas e clientes sem hora marcada compartilham a fila do barbeiro. **[DECIDIDO pelo critério]** O cliente com reserva sempre escolhe o barbeiro; o cliente sem reserva entra na fila do barbeiro que o registra. "Primeiro disponível" não existe no início.
- Espera estimada = soma das durações dos atendimentos à frente (e do atual, pelo tempo restante), com ajuste manual do barbeiro. O ajuste manual vale até o próximo evento da fila. A tela deve dizer que é estimativa.
- O termômetro da barbearia resume os barbeiros: mostra a **menor espera** entre os barbeiros em atividade e quantos estão atendendo; cada barbeiro tem o seu.
- O horário de funcionamento por barbearia alimenta o estado "Fechado" fora do expediente. Se o status passar de 60 min sem atualização no horário de funcionamento, o barbeiro recebe um lembrete.
- Status sem atualização acima de `queueStaleAfterMinutes` é exibido como desatualizado, sem minutos.
- O barbeiro executa só **iniciar** e **finalizar**; chegada é do cliente (WhatsApp) ou do barbeiro.

### 6.1 Clientes sem reserva (walk-ins)
- **[DECIDIDO]** O atendimento é inteiramente a critério do barbeiro: havendo fila, ele decide se inclui a pessoa na frente; não havendo fila, encaixa.
- **[DECIDIDO]** O registro no painel é opcional e dividido em duas ações:
  - **Contar atendimento:** 1 toque, anônimo; alimenta ocupação.
  - **Identificar cliente:** nome e telefone com consentimento; alimenta retenção.
- Sem registro, o atendimento não entra nas métricas do Premium. O painel mostra a **cobertura dos dados** (ex.: "calculado com 60% dos atendimentos registrados").
- **[DECIDIDO]** O sistema alerta o barbeiro quando um encaixe vai atrasar a próxima reserva (ex.: "atrasa a reserva das 15h em cerca de X min"). Se o atraso passar de 15 min, aplica-se 4.7 e o evento entra na pontualidade do barbeiro, com a causa registrada (`cause = walk_in`).
- Reserva com check-in dentro da tolerância tem preferência sobre cliente sem reserva **[DECIDIDO]**: o barbeiro vê a prioridade no painel, mas pode ser mais brando.

## 7. Termos exibidos no checkout (mínimo)

Valor total, valor do sinal e que será abatido; antecedência mínima de 60 min; **fim do reembolso em T−50** e a consequência depois dele; reagendamento com crédito total até T−50 e com taxa reduzida (retenção de parte do sinal) depois disso; tolerância de 10 min e cancelamento automático em T+10 sem check-in, com a retenção do sinal e a regra do sinal reforçado na reserva seguinte; que o barbeiro pode ser mais brando, nunca mais duro; regra de atraso do barbeiro; quem recebe o pagamento (nome da barbearia); como cancelar e remarcar; aceite explícito antes do Pix. Cada versão tem número e data.

## 8. WhatsApp

- Somente templates de **utilidade** (confirmação, aviso de T−55, aviso de T, cancelamento e reembolso, atraso do barbeiro, remarcação). Sem promoções.
- Toda mensagem cita o nome da barbearia (número compartilhado). Respostas por botão carregam o identificador da reserva.
- Mensagem livre do cliente é interpretada só dentro dos fluxos permitidos; fora deles o bot encaminha a um humano.
- O consentimento é registrado no checkout; "parar" interrompe as mensagens de imediato.
- Cada mensagem é registrada com categoria e custo estimado, por barbearia, para sustentar o preço dos planos.
- Os disparos de T−55, T e T+10 exigem agendador com precisão de minutos, idempotente e que reagenda sozinho se a reserva for remarcada ou cancelada (VPS, ver `docs/architecture.md` D16).

## 9. Avaliações (Fase 4)

- Só o cliente com atendimento `completed` avalia, uma vez por atendimento, em prazo limitado **[DECIDIDO: 14 dias]**.
- A barbearia pode denunciar, mas não apagar, uma avaliação; a moderação segue regras públicas.
- A média só aparece depois de um mínimo de avaliações **[DECIDIDO: 5]**.

## 10. Índice de saúde do negócio (Premium, Fase 4)

**[DECIDIDO]** Quatro pilares:
1. **Taxa de ocupação** da agenda.
2. **Taxa de não comparecimento (no-show):** o indicador é só a taxa. Retenção do sinal e reembolso são consequências, não componentes da métrica.
3. **Retenção de clientes** (usa identificador pseudonimizado, ver seção 12).
4. **Pontualidade do barbeiro:** diferença entre o início do atendimento e o maior entre T e `arrived_at`. Pontualidade do cliente fica de fora.

**[DECIDIDO, valores iniciais revisados aos 90 dias do piloto]**
- Janela: últimos 30 dias, móvel. Retenção: clientes identificados com 2 ou mais atendimentos nos últimos 90 dias, dentro do período de retenção de dados.
- Exibição: os quatro componentes lado a lado. Número único só depois de validar os pesos; proposta de pesos: ocupação 30%, no-show 25%, pontualidade do barbeiro 25%, retenção 20%.
- Amostra mínima: 30 atendimentos na janela. Cobertura de registro (6.1) sempre visível; abaixo de 50% de cobertura o índice mostra "dados insuficientes" em vez de um valor.

## 11. Indicadores financeiros (Premium)

- Fonte: eventos do gateway (sinais recebidos, reembolsos) e atendimentos concluídos.
- Os sinais cobrem só parte do valor; o restante é pago na barbearia. O "faturamento estimado" usa o preço do serviço registrado na reserva e **deve ser rotulado como estimado**, não como valor conciliado.
- As projeções financeiras do negócio são **estimativas teóricas** e não definem preço de plano.

## 12. LGPD: papéis, retenção e exclusão

- A **barbearia é controladora** e a **plataforma é operadora**. A barbearia atende os pedidos dos titulares, por um canal único fornecido pela plataforma.
- **[DECIDIDO]** Dados pessoais (reservas e telefone) ficam retidos por **12 meses após a última atividade** do cliente. Depois: agregação anual para manter métricas históricas e exclusão dos registros individuais.
- **[DECIDIDO]** O cliente pode pedir a exclusão a qualquer momento.
- **Pseudonimização:** dado pseudonimizado ainda é dado pessoal na LGPD enquanto houver como reidentificar. Regra adotada: o identificador pseudonimizado existe **só durante os 12 meses de retenção**, e a métrica de retenção usa janela móvel dentro desse período. Na agregação anual, o identificador e a chave de reidentificação são descartados; os agregados não carregam identificador. Gate jurídico.
- **Registros de pagamento:** retidos por **5 anos** sem identificação direta (valor, data, ID do gateway e da reserva; nome e telefone removidos) para atender obrigações fiscais e contábeis **[DECIDIDO]**. Gate contábil na Fase 0 confirma o prazo; o padrão vale até lá.
- **Menores de idade:** dados e fotos de menores exigem autorização do responsável, registrada. O checkout declara que o usuário é maior de 18 anos ou responsável.
- **Pedidos do titular:** a identidade é confirmada pelo WhatsApp do telefone cadastrado; resposta em até 15 dias (limite da LGPD), com meta interna de 5 dias úteis **[DECIDIDO]**; o gate jurídico confirma.
- Backups guardam dados excluídos até rotacionarem: a restauração reaplica a lista de exclusões.
- Fotos de antes/depois são dados pessoais: bucket privado, URL assinada temporária, remoção de EXIF no upload, autorização de uso de imagem registrada (ver `docs/architecture.md`).

## 13. Exceções operacionais (resumo; detalhes em `docs/risks-and-processes.md`)

- **Pagamento depois da expiração:** se o horário ainda está livre, a reserva é confirmada; se foi ocupado, o sinal é reembolsado integralmente e o cliente é avisado.
- **Atraso do agendador:** o cancelamento automático de T+10 só ocorre se a tarefa executar até 5 min depois do prazo; depois disso vira decisão do barbeiro, com alerta ao operador.
- **Aviso de T−55 não entregue (ou cliente sem WhatsApp ativo):** o cancelamento automático não retém o sinal sozinho; a retenção vira decisão do barbeiro, sinalizada no painel.
- **Check-in pelo WhatsApp:** vale a partir de T−15. O barbeiro pode reverter com motivo, registrado.
- **Barbeiro ausente ou barbearia fechada no dia:** cancelamento em lote por barbeiro e dia; cada cliente escolhe reembolso integral ou reagendamento com crédito total do sinal (sem taxa), tudo automático.
- **Reembolso que falha:** 3 novas tentativas em 24 h e depois alerta ao dono e ao operador; a plataforma nunca adianta valores.
- **Margem de serviço:** cada serviço pode ter `buffer_minutes` para a conta de disponibilidade.
- **Menor de idade:** a reserva é feita pelo responsável.
