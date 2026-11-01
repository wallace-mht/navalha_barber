# Qualidade — Barbearia Web

Diretrizes de qualidade e checks obrigatórios.

## Gates de Qualidade
- `npm run check` deve passar antes de qualquer commit na `main`.
- Toda regra de domínio (tempo, dinheiro, status) exige teste unitário.
- Toda funcionalidade de tenant exige teste de isolamento.
- **Isolamento de tenant:** não pode haver leitura/escrita cruzada.
- **Privacidade:** telefone deve ser mascarado em logs; LGPD respeitada.

## Processo de Review
- Seguir os ciclos recomendados em `AGENTS.md`.
- Uso obrigatório do `security-reviewer` em mudanças de auth, pagamentos e isolamento.
