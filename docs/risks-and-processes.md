# Problemas previstos e soluções adotadas

> Registro de riscos operacionais, legais e técnicos, com a solução escolhida para cada um e a fase em que entra. Revisar a cada fase. Todo item tem solução decidida. Os gates de liberação (jurídico, contábil, Meta, gateway) estão em `PRODUCT.md`, seção 15.
> Regras de tempo e dinheiro: `docs/business-rules.md`. Decisões técnicas: `docs/architecture.md`.

## A. Reserva e pagamento

| # | Problema | Solução | Fase |
|---|---|---|---|
| A1 | Dois clientes pegam o mesmo horário | Restrição de exclusão no PostgreSQL (D14) + teste de concorrência | 2 |
| A2 | Pix pago depois de a reserva expirar (webhook atrasado) | Ao receber o pagamento de reserva `expired`: se o horário ainda está livre, confirma; se foi ocupado, reembolso automático integral, aviso ao cliente e registro do evento | 3 |
| A3 | Pagamento duplicado, valor errado ou de outra cobrança | Conciliar por ID da cobrança e valor; qualquer divergência vira reembolso e alerta, nunca confirmação | 3 |
| A4 | Webhook perdido | Rotina que consulta no gateway as cobranças pendentes e reconcilia o dia; alerta em divergência (D13) | 3 |
| A5 | Abuso: reservas falsas que seguram horários | Fase 2 (sem pagamento): limite de 2 reservas ativas por telefone, limite por IP, Cloudflare Turnstile, telefone validado pelo envio da confirmação. Fase 3: o sinal em Pix já desestimula | 2 e 3 |
| A6 | Reembolso falha por falta de saldo na conta da barbearia | Estado `failed`; 3 novas tentativas em 24 h; depois alerta ao dono e ao operador; o cliente vê o status na página da reserva. A plataforma nunca adianta dinheiro | 3 |
| A7 | Disputa ou contestação do cliente | Pacote de evidência por reserva (termos aceitos com versão, eventos, mensagens, check-in) exportável pelo painel; termos claros no checkout | 3 |
| A8 | Preço do serviço muda depois da reserva | O preço e o sinal ficam gravados na reserva; extras são cobrados na barbearia, sem recalcular o sinal | 2 |
| A10 | Retenção parcial, taxa reduzida e sinal por barbeiro geram reclamação ou parecem arbitrários | Todos os percentuais vêm de configuração, aparecem exatos no checkout e ficam gravados na reserva; o barbeiro só reduz ou dispensa, nunca aumenta; tudo no `audit_log`; revisão jurídica antes da Fase 3 | 3 |
| A9 | Cliente reserva para outra pessoa ou para menor de idade | O nome é de quem será atendido, o telefone é o contato. Menor: reserva feita pelo responsável, que aceita os termos e autoriza imagem (ver D) | 2 |

## B. Tempo e agendador

| # | Problema | Solução | Fase |
|---|---|---|---|
| B1 | Agendador fora do ar ou atrasado no momento do T+10 | A tarefa recalcula o estado por função pura (com `now`, `arrived_at` e check-in) e só cancela automaticamente se estiver executando até 5 min depois do prazo. Atrasada além disso: não cancela, sinaliza ao barbeiro e alerta o operador. Nunca punir o cliente por falha nossa | 2 e 3 |
| B2 | Tarefa executada duas vezes | Idempotência por reserva e evento; reagendamento automático quando a reserva muda | 2 |
| B3 | Relógio do servidor errado | NTP no VPS; `now` do servidor; teste de borda de tempo | 2 |
| B4 | Check-in falso para evitar o no-show | Check-in pelo WhatsApp só vale a partir de T−15; o barbeiro vê o check-in e pode revertê-lo com motivo, registrado; padrão de reversões repetidas é revisado pelo operador | 3 |
| B5 | Serviço demora mais que o previsto e atrasa tudo | Ajuste manual do barbeiro vale até o próximo evento da fila; cada serviço pode ter margem (`buffer_minutes`); o termômetro mostra estimativa, não promessa | 2 |
| B6 | Fuso e feriados | Datas em UTC, exibição em `America/Fortaleza` (D17); folgas e feriados por `time_off` | 2 |

## C. WhatsApp

| # | Problema | Solução | Fase |
|---|---|---|---|
| C1 | Templates demoram ou são reprovados | Redigir e submeter os templates já na Fase 0/início da 2; a página `/reserva/[token]` sempre mostra o estado e as regras, como alternativa à mensagem | 2 |
| C2 | Aviso de T−55 não entregue, ou cliente deu "parar" | Registrar o status de entrega. Se o aviso falhou, o cliente não pôde agir dentro da janela: o cancelamento automático em T+10 **não retém** o sinal sozinho; vira decisão do barbeiro, sinalizada no painel. O checkout avisa que o WhatsApp é necessário | 3 |
| C3 | Reputação do número compartilhado cai por culpa de uma barbearia | Limite de envio por barbearia e por telefone, acompanhamento da qualidade do número, e migração das barbearias de maior volume para número dedicado | 2 |
| C4 | Mensagem respondida na barbearia errada | Botões com identificador da reserva; toda mensagem cita a barbearia | 2 |
| C5 | Bot é induzido a responder o que não deve (injeção de prompt) | O LLM só classifica a intenção em lista fechada; nenhuma ação vem de texto livre; sem acesso a dados de outras reservas; teto de gasto; teste de recusa | 2 |
| C6 | Custo por mensagem estoura o preço do plano | 3 mensagens no fluxo normal; custo registrado por barbearia; preço mínimo do plano = custo medido + margem; limite mensal por plano | 2 e 4 |
| C7 | Perfil da empresa e verificação da Meta | O operador precisa de CNPJ e verificação de negócio na Meta; número dedicado exige o mesmo passo por barbearia. Entra no checklist da Fase 0 e da Fase 5 | 0 e 5 |

## D. LGPD e dados

| # | Problema | Solução | Fase |
|---|---|---|---|
| D1 | Menores de idade (cortes infantis) | Dados e fotos de menores exigem autorização do responsável; foto de antes/depois de menor só com autorização escrita registrada; o checkout declara que o usuário é maior de 18 anos ou responsável | 1 e 2 |
| D2 | Pedido de exclusão ou acesso do titular | Canal único da plataforma; identidade confirmada pelo WhatsApp do telefone cadastrado; resposta em até 15 dias, meta interna de 5 dias úteis; exportação e exclusão por rotina | 2 |
| D3 | Incidente de segurança | Roteiro: conter, avaliar, comunicar a barbearia (controladora) imediatamente; a barbearia comunica a ANPD e os titulares em até 3 dias úteis, prazo que o gate jurídico confirma; a plataforma entrega o relatório do incidente em até 24 h | 3 |
| D4 | Backup guarda dado já excluído | Lista de exclusões reaplicada após qualquer restauração (D25) | 3 |
| D5 | Telefone em logs, erros e métricas | Mascaramento obrigatório; ferramenta de erros auto-hospedada ou sem dados pessoais; sem analytics invasivo | 2 |
| D6 | Fotos enviadas com metadados ou arquivos maliciosos | Validar tipo e tamanho, reprocessar a imagem no servidor (remove EXIF e conteúdo embutido) e gerar os tamanhos | 1 |
| D7 | Documentos legais ausentes | Conjunto mínimo: termos de uso da plataforma (contrato com a barbearia), acordo de tratamento de dados (controladora e operadora), política de privacidade do cliente final, termos do checkout. Revisão do advogado antes da Fase 3 | 1 a 3 |

## E. Multi-tenant e segurança

| # | Problema | Solução | Fase |
|---|---|---|---|
| E1 | Vazamento entre barbearias por cache | Toda chave de cache inclui o `shopId`; respostas públicas com `Vary: Host`; teste que acessa dois hosts em sequência | 1 |
| E2 | Sessão válida em outra barbearia | Cookie de sessão restrito ao host (sem `Domain` amplo), `httpOnly`, `SameSite`; sessão guarda `shopId` e é validada a cada mutação | 1 |
| E3 | Subdomínios reservados | Lista de slugs proibidos (`www`, `api`, `painel`, `admin`, `app`, `status` e semelhantes) | 1 |
| E4 | Senha perdida de barbeiro ou dono | Sem infraestrutura de e-mail no início: o dono redefine a senha do barbeiro; o operador redefine a do dono após confirmar a identidade. Dono com autenticação em dois fatores (TOTP) a partir da Fase 3 | 1 e 3 |
| E5 | Domínio próprio apontado errado ou abandonado | Endpoint de verificação do Caddy só autoriza domínios cadastrados e com DNS validado; offboarding remove o domínio; monitorar expiração de certificado | 1 e 5 |
| E6 | Limites de emissão de certificados | Subdomínios padrão usam certificado curinga; domínios próprios emitem sob demanda, com teto de emissões por dia | 1 |
| E7 | Credenciais de gateway comprometidas | Preferir OAuth com escopo mínimo; chaves criptografadas com `ENCRYPTION_KEY` mantida fora dos backups; rotação possível; auditoria de uso | 3 |
| E8 | Painel do Coolify ou SSH expostos | Painel só acessível por VPN ou lista de IPs, autenticação em dois fatores, atualização frequente; painel em servidor separado quando houver receita (D26) | 1 |
| E9 | Postgres exposto | Porta só na rede interna; sem acesso público | 1 |
| E10 | Registro do que cada pessoa fez | Tabela `audit_log` (quem, quando, o quê) para perdão, reversão de check-in, reembolso, mudança de política e acessos do operador | 2 |

## F. Infraestrutura e operação

| # | Problema | Solução | Fase |
|---|---|---|---|
| F1 | Servidor único cai | Meta de retorno em 4 h com roteiro escrito; snapshots do VPS; status externo; contrato de manutenção sem promessa de alta disponibilidade | 1 a 5 |
| F2 | Build compete por memória com a produção | Build e testes na integração contínua (GitHub Actions), imagem enviada a um registro, o Coolify só faz o deploy da imagem | 1 |
| F3 | Migration quebra a produção | Migration revisada, compatível com a versão anterior, backup antes de aplicar, nunca no build nem por request; ensaio em ambiente de teste | 1 |
| F4 | Testar Pix e WhatsApp sem dinheiro real | Ambiente de teste separado (outro projeto no Coolify) com sandbox do gateway e número de teste do BSP | 2 e 3 |
| F5 | Operador único (risco de ficar indisponível) | Roteiros escritos, credenciais em cofre de senhas com acesso de emergência para uma segunda pessoa, checklist de onboarding | 0 e 5 |
| F6 | Suporte sem processo | Canal único, horário de atendimento e prazos por gravidade definidos no contrato; incidentes comunicados à barbearia | 1 |
| F7 | Carga do polling de `/api/fila` | Resposta com cache curto (cerca de 15 s) por barbearia, `Vary: Host`; polling pausado em aba oculta | 1 |
| F8 | Monitoramento | Disponibilidade externa ao servidor; alerta de backup que não rodou; alerta de reembolso falho, webhook com erro, certificado perto de vencer, fila de tarefas atrasada | 1 a 3 |

## G. Negócio e contrato

| # | Problema | Solução | Fase |
|---|---|---|---|
| G1 | Barbearia inadimplente | Carência de 10 dias; depois, suspende novas reservas e mantém o site em modo leitura; reservas já pagas continuam sendo honradas e reembolsáveis | 4 |
| G2 | Barbearia encerra o contrato | Offboarding: exportar dados, desconectar o gateway e revogar tokens, apagar dados após 30 dias, remover domínio | 5 |
| G3 | Preço do plano não cobre o custo | Preço mínimo = custo medido por barbearia + margem; custos medidos desde a Fase 1; revisão trimestral | 0 a 4 |
| G4 | Barbearia sem CNPJ ou sem conta de gateway apta | Checklist de onboarding verifica a conta de gateway da barbearia antes de ativar reserva com Pix; sem ela, a barbearia fica no plano Base | 3 e 5 |
| G5 | Taxas do gateway e reembolso de Pix | Quem paga as taxas é a barbearia, informado no contrato; o reembolso é do valor do sinal | 3 |
| G6 | Faturamento e impostos do operador | Contador define o enquadramento e a nota fiscal da mensalidade na Fase 0, antes da primeira cobrança | 0 e 4 |
| G7 | Barbeiro sai da barbearia, falta ou fecha no dia | Desativar o barbeiro; ferramenta de cancelamento em lote por barbeiro e dia, que avisa os clientes e oferece reembolso ou reagendamento, ambos automáticos | 2 e 3 |
| G8 | Barbeiro não atualiza a fila | Status velho aparece como desatualizado; horário de funcionamento por barbearia alimenta o estado "Fechado"; lembrete ao barbeiro quando o status passa de 60 min no horário de funcionamento | 1 |

## H. Itens adicionais

| # | Problema | Solução | Fase |
|---|---|---|---|
| H1 | O pagamento sai depois do início do horário de retenção e o aviso de T−55 viria antes da confirmação | Só são oferecidos horários em que `agora + holdMinutes + 60 ≤ T`; o aviso de T−55 sempre vem depois do pagamento | 3 |
| H2 | Variação do euro e das tarifas da Meta come a margem | Cláusula de repasse com aviso de 30 dias; revisão trimestral; franquia de 100 reservas por mês no Premium e excedente a custo mais 20%; margem de 40% como meta a partir de 25 barbearias | 4 |
| H3 | Pix contestado por fraude (devolução especial) | O gateway da barbearia aplica a devolução; o pacote de evidência da reserva é exportável; o evento do gateway cancela a reserva e alerta | 3 |
| H4 | Número compartilhado bloqueado pela Meta | Migrar as barbearias de maior volume para número dedicado; o site continua mostrando o estado da reserva; plano de contingência no roteiro de recuperação | 2 |
| H5 | Dono muda a política com reservas existentes | A política é gravada com cada reserva (D19); a mudança só vale para novas reservas | 3 |
| H6 | Duas unidades na mesma barbearia | Cada unidade é uma barbearia separada, com plano próprio | 1 |
| H7 | Mensalidade baixa (R$ 60 e R$ 80) não cobre o custo no início | A implantação (R$ 200 e R$ 400) entra no caixa; repasse do excedente; Base sem WhatsApp pago; teto de IA do bot por barbearia; metas de margem só a partir de 25 barbearias; o piloto é aceito perto do ponto de equilíbrio | 1 a 4 |
| H8 | Cliente do Base quer recursos do Premium | Troca de plano pelo painel, cobrando só a diferença de implantação (R$ 200); recursos do Premium protegidos por feature flag no servidor | 4 |
| H9 | Inadimplência de mensalidade pequena | Cobrança recorrente automática com aviso; carência de 10 dias; suspensão como em G1 | 4 |
