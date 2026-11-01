# Design — Barbearia Web

> Identidade visual e regras de interface. Fonte dos tokens: o tema do Tailwind e as variáveis CSS do layout do tenant. Referência navegável: `docs/design-reference.html` (abra no navegador). Origem das ideias: o site Rota 360 (`docs/reference/rota360-site.zip`).

## 1. Conceito: Órbita

Moderno e futurista sem ficar frio. A base herda do Rota 360 o verde-floresta profundo, o caramelo, as grandes áreas arredondadas e o título leve em Outfit. A leitura futurista vem de três escolhas:

1. **Fundo escuro por padrão**, em verde-noite, com painéis de vidro (fundo translúcido, desfoque e fio de 1 px).
2. **A órbita como assinatura.** O arco fino do logo do Rota 360 vira o anel do termômetro de fila: um arco de 360° que mostra a espera. É o único elemento que brilha. O resto fica quieto.
3. **Números grandes e leves.** Minutos de espera, horários e preços usam Outfit leve com algarismos tabulares.

Decisão de restraint: um único ponto de brilho por tela (o anel na home do cliente, o botão principal no painel). Sem gradientes decorativos em cartões, sem ícones em todo título, sem etiquetas em caixa alta.

## 2. Cores (tokens)

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `--noite` | `#0C1D16` | Fundo da página (escuro) | base |
| `--floresta` | `#1F3D32` | Superfícies elevadas, botão secundário | texto claro 11,1:1 |
| `--vidro` | `rgba(250,247,241,.06)` com borda `rgba(250,247,241,.14)` | Painéis de vidro | — |
| `--offwhite` | `#FAF7F1` | Texto principal no escuro; fundo no claro | 16,3:1 sobre `--noite` |
| `--nevoa` | `#B9C7BF` | Texto secundário no escuro | 10,0:1 sobre `--noite` |
| `--brasa` | `#E6BE8C` | Acento no escuro: anel, botão principal, foco | 10,1:1 sobre `--noite` |
| `--caramelo` | `#C49A6C` | Marca (do Rota 360); traços e preenchimentos grandes | 6,8:1 sobre `--noite`; **não usar como texto sobre claro (2,4:1)** |
| `--caramelo-escuro` | `#8A6236` | Texto de destaque sobre claro | 5,1:1 sobre `--offwhite` |
| `--grafite` | `#3E3A36` | Texto principal no claro | 10,5:1 sobre `--offwhite` |
| `--bege` | `#EADCCB` | Superfícies no tema claro | grafite 8,4:1 |

Estados da fila (sempre com **texto + ícone + cor**, nunca só cor):

| Estado | Cor | Ícone | Texto |
|---|---|---|---|
| Sem fila | `#7FD8A6` | círculo vazio | "Sem fila" |
| Fila normal | `#E6BE8C` | meio círculo | "Fila normal" |
| Fila cheia | `#F2A15F` | círculo cheio | "Fila cheia" |
| Pausa ou fechado | `#9FB0A8` | pausa | "Pausa" / "Fechado" |
| Desatualizado | `#9FB0A8` com anel tracejado | relógio | "Status desatualizado" (sem minutos) |

Todos têm 7,7:1 ou mais sobre `--noite`.

Tema claro (opcional, `prefers-color-scheme: light` ou escolha do cliente): fundo `--offwhite`, painéis `--bege` a 60%, texto `--grafite`, acento `--floresta` para botões e `--caramelo-escuro` para realces em texto.

## 3. Tema por barbearia (multi-tenant)

- O tenant escolhe **uma cor de acento** e **um logo**. O resto vem do tema da plataforma. Nada de CSS gerado por barbearia no build.
- No layout do tenant, o acento vira `--acento` e o texto sobre ele `--acento-texto`. O servidor calcula o contraste: se o acento escolhido tiver menos de 4,5:1 contra o fundo, o sistema escurece ou clareia o acento até passar e mostra o valor aplicado no painel.
- O padrão sem personalização é `--brasa`. O logo é exibido sobre uma placa `--floresta` arredondada para funcionar em qualquer cor.
- Estados da fila têm cores fixas da plataforma; o tenant não as altera.

## 4. Tipografia

- **Outfit** (Google Fonts, via `next/font`, subconjunto latino), pesos 300, 400 e 500. Uma só família, como no Rota 360.
- Títulos em peso 300 com espaçamento levemente negativo; corpo em 400; ênfase em 500.
- Algarismos tabulares (`font-variant-numeric: tabular-nums`) em horários, preços e minutos.
- Escala (mobile → desktop): 

| Papel | Mobile | Desktop | Peso |
|---|---|---|---|
| Número do termômetro | 72 px | 112 px | 300 |
| Título da página | 36 px | 64 px | 300 |
| Título de seção | 28 px | 40 px | 300 |
| Título de cartão | 18 px | 20 px | 500 |
| Corpo | 16 px | 17 px | 400 |
| Apoio | 14 px | 14 px | 400 |

- Linhas de texto com no máximo 70 caracteres. Sem caixa alta em etiquetas; use frase normal.

## 5. Forma, espaço e movimento

- **Raios por hierarquia** (herdados do Rota 360): painel de seção `2rem`; cartão `1.25rem`; botão e filtro em pílula (`9999px`); imagem do corte `1rem`.
- **Painéis recuados:** seções principais como painéis de vidro com margem lateral de 12 px (mobile) e 16 px (desktop), como no Rota 360.
- Espaço base de 4 px; seções com 64 px (mobile) e 96 px (desktop) de respiro vertical.
- **Fundo:** `--noite` com dois arcos finos (SVG, 1 px, `--caramelo` a 18%) como a órbita do logo. Sem imagens pesadas.
- **Movimento:** uma única animação de entrada, o arco do anel se desenhando em 900 ms. Respostas a ações (abrir modal, trocar filtro, confirmar) têm transição de 150 a 220 ms. Com `prefers-reduced-motion`, tudo é instantâneo.
- **Foco:** anel de 2 px em `--brasa` com recuo de 3 px, sempre visível.

## 6. Componentes

**Termômetro (anel).** SVG de 360°: trilho fino, arco proporcional à espera (0 a 60 min; acima disso, arco cheio), número grande no centro, estado em texto e ícone abaixo, e "atualizado há N min" em apoio. Desatualizado: arco tracejado, sem minutos, texto "Status desatualizado". Na home do cliente é o maior elemento acima da dobra. Na barbearia com vários barbeiros mostra a menor espera e uma lista de anéis pequenos, um por barbeiro.

**Vitrine de cortes.** Grade de cartões `1.25rem` com foto (`next/image`), nome, estilo e duração; filtros em pílulas nativas rotuladas na URL; resultado anunciado em região `aria-live`. Sem bordas coloridas ou sombras cinza padrão: o cartão é vidro com fio de 1 px.

**Modal do corte.** Painel de vidro sobre fundo desfocado. Comparador antes/depois com controle deslizante (`input range` nativo estilizado). Fecha com `Esc` e devolve o foco ao cartão.

**Botões.** Primário: pílula `--brasa` com texto `--noite` (10,1:1). Secundário: pílula `--floresta` com texto `--offwhite`. Terciário: texto com sublinhado. Alvo de toque mínimo de 44×44 px; no painel do barbeiro, 56 px.

**Painel do barbeiro.** Duas ações grandes: **Iniciar** e **Finalizar**, em pílulas de largura total. Abaixo, a fila em lista simples e o botão "Ajustar espera". Alertas (T+5, atraso) em faixa fixa no topo com texto e ícone, nunca só cor.

**Página da reserva.** Linha do tempo vertical (aqui os números fazem sentido: é uma sequência) com o estado atual destacado, a política resumida e os botões Cancelar e Remarcar com a consequência escrita no próprio botão ("Cancelar e receber o sinal de volta" ou "Cancelar e perder o sinal").

**Estados de tela.** Toda tela de dados tem carregando (esqueleto sem brilho), vazio (diz o que fazer), erro (diz o que houve e como resolver) e desatualizado.

## 7. Textos da interface (pt-BR)

- Frase normal, verbos ativos, sem enfeite: "Ver estilos", "Reservar horário", "Chamar no WhatsApp", "Iniciar atendimento".
- A ação mantém o nome em todo o fluxo: o botão "Finalizar atendimento" gera a confirmação "Atendimento finalizado".
- Erros não pedem desculpa e dizem como resolver: "O Pix expirou. Escolha o horário de novo para gerar outro código."
- "Multa" nunca aparece na interface: use "retenção do sinal" (ver `docs/business-rules.md`).
- Termômetro: "Fila normal, cerca de 20 min", "Sem fila", "Pausa", "Fechado", "Status desatualizado".

## 8. Acessibilidade e desempenho

- Contraste AA em todos os pares da tabela de cores; o valor está ao lado de cada token.
- Navegação completa por teclado; modal com foco preso; controles nativos rotulados.
- `prefers-reduced-motion` e `prefers-color-scheme` respeitados.
- O desfoque de fundo (`backdrop-filter`) tem alternativa: sem suporte, o painel usa `--floresta` opaco.
- Fonte Outfit via `next/font` (sem requisição externa em tempo de execução); imagens via `next/image` com `sizes`; o anel é SVG inline.
- Mobile primeiro: base de 360 px.

## 9. Variáveis CSS e Tailwind

```css
:root {
  --noite: #0c1d16;      --floresta: #1f3d32;   --offwhite: #faf7f1;
  --nevoa: #b9c7bf;      --brasa: #e6be8c;      --caramelo: #c49a6c;
  --caramelo-escuro: #8a6236; --grafite: #3e3a36; --bege: #eadccb;
  --vidro: rgb(250 247 241 / .06);  --vidro-borda: rgb(250 247 241 / .14);
  --acento: var(--brasa);  --acento-texto: var(--noite);
  --raio-painel: 2rem;  --raio-cartao: 1.25rem;  --raio-imagem: 1rem;
}
```

Os tokens entram uma vez no tema do Tailwind (cores `noite`, `floresta`, `offwhite`, `nevoa`, `brasa`, `caramelo`, `grafite`, `bege`; raios `painel`, `cartao`; fonte `sans: Outfit`). Não use cores arbitrárias `[#xxxxxx]` espalhadas.

## 10. O que evitar

Caixa alta em etiquetas; o mesmo raio em tudo; sombras cinza em todos os cartões; brilho em mais de um elemento por tela; números de 01 a 03 em conteúdo que não é sequência; cor como único sinal de estado; imagens de clientes sem autorização registrada.
