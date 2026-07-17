# Comptus — Design System "Navalha & Latão"

> Complementa `ORIENTACAO-BARBERSAAS.md`. Toda tela nova segue este documento.
> Regra geral: elegância vem de disciplina — pouca cor, muito espaço, tipografia bem usada.

---

## 1. Princípio central: dois mundos, um sistema

| Contexto | Objetivo | Tema |
|---|---|---|
| **Painéis** (`/app` e `/admin`) | Ferramenta de trabalho diário: clareza, densidade controlada, zero fadiga | Claro (marfim), sóbrio, acento latão discreto |
| **Página pública** (`/b/{slug}`) | Vitrine da barbearia/salão: personalidade, conversão de agendamento | Tema escolhido pelo tenant (presets abaixo) |

Tudo implementado com **CSS variables** — os componentes são os mesmos, só os tokens mudam.
Nunca hardcodar cor em componente; sempre `var(--token)`.

## 2. Tokens base

```css
:root {
  /* Paleta Navalha & Latão */
  --carvao: #17191C;        /* fundo escuro / texto sobre claro */
  --carvao-2: #22262A;      /* superfície elevada no escuro */
  --marfim: #F4F2ED;        /* fundo claro */
  --marfim-2: #FFFFFF;      /* cards no claro */
  --latao: #C9A15C;         /* acento principal (dourado envelhecido) */
  --latao-escuro: #A8834A;  /* hover/pressed do latão */
  --cedro: #2E4038;         /* secundária profunda */
  --cinza-600: #6E6961;     /* texto secundário */
  --cinza-300: #B9B3A8;     /* texto terciário / placeholders */
  --linha: #E5E1D8;         /* bordas no claro */
  --linha-escuro: #2E3237;  /* bordas no escuro */

  /* Funcionais (discretas, nunca saturadas demais) */
  --sucesso: #3E7C4F;
  --erro: #B04A3E;
  --aviso: #B98A2E;

  /* Tipografia */
  --font-display: 'Marcellus', serif;        /* títulos, nome da barbearia */
  --font-sans: 'Instrument Sans', sans-serif; /* corpo, UI */

  /* Ritmo */
  --radius-sm: 8px;   /* inputs, chips */
  --radius-md: 12px;  /* cards, botões grandes */
  --radius-lg: 20px;  /* modais, hero */
  --space: 4px;       /* escala: 4, 8, 12, 16, 24, 32, 48, 64 */
}
```

Fontes via `next/font/google` (Marcellus, Instrument Sans) — nunca por `<link>` manual.

## 3. Tipografia

- **Marcellus** apenas em: nome da barbearia, títulos de página (h1/h2) e números de destaque no hero. Nunca em parágrafos, botões ou tabelas.
- **Instrument Sans** para todo o resto. Pesos: 400 e 500 apenas (600+ proibido — pesa demais).
- Financeiro/tabelas: `font-variant-numeric: tabular-nums` obrigatório.
- Escala: 12 / 13.5 / 15 (base) / 18 / 22 / 28 / 36. `line-height` 1.5 no corpo, 1.2 em títulos.
- Eyebrows de seção: 12px, `letter-spacing: 0.14em`, maiúsculas, cor latão — sempre acompanhadas do fio (abaixo).

## 4. Elemento-assinatura: o fio de latão

Linha de **1px, cor `--latao`, largura ~34px**, posicionada sob eyebrows/títulos de seção
e como marcador do item ativo na sidebar do painel (borda esquerda de 2px latão).
É o único adorno permitido. Não criar outros enfeites (sem gradientes, sem glow, sem padrões de fundo).

```css
.fio::after {
  content: ''; display: block; width: 34px; height: 1px;
  background: var(--latao); margin-top: 6px;
}
```

## 5. Temas da página pública (presets por tenant)

Cada barbearia escolhe um preset no onboarding (campo `barbearias.config.tema`).
O preset define um conjunto de variáveis aplicado no layout `/b/[slug]`:

| Preset | Público | Fundo | Texto | Acento (default) |
|---|---|---|---|---|
| `classica` (default) | Barbearia tradicional | `--carvao` | `--marfim` | `--latao` |
| `moderna` | Barbearia/estúdio jovem | `--marfim` | `--carvao` | `--carvao` (botões escuros) |
| `delicada` | Salão de beleza | `#FAF7F4` | `#3A3330` | `#B4826E` (rosé queimado) |

- O tenant pode ainda sobrescrever o **acento** com uma cor própria (validar contraste WCAG AA ≥ 4.5:1 contra o fundo do preset; se falhar, ajustar automaticamente para o tom mais próximo que passe).
- Logo e foto de capa são do tenant; tipografia e layout **não mudam** (consistência da plataforma).
- Implementação: `data-tema="classica"` no `<body>` da rota pública + blocos CSS por tema.

## 6. Componentes — regras

- **Botão primário:** fundo `--latao`, texto `--carvao`, radius `--radius-md`, altura 44–48px no mobile (área de toque). Um primário por tela, no máximo.
- **Botão secundário:** transparente, borda 1px `--linha(-escuro)`, texto da superfície.
- **Cards:** superfície elevada, borda 0.5–1px, radius `--radius-md`, sem sombra (ou sombra mínima `0 1px 2px rgb(0 0 0 / .06)` no tema claro).
- **Chips de horário:** radius `--radius-sm`, borda 1px; selecionado = fundo latão + texto carvão.
- **Inputs:** altura 44px, borda 1px, foco = borda latão + ring suave. Labels sempre visíveis (não usar placeholder como label).
- **Tabelas do painel:** linhas com borda inferior 0.5px, sem zebra; hover sutil.
- **Estados da agenda (cores funcionais):** pendente = aviso, confirmado = latão, concluído = sucesso, cancelado = cinza, no-show = erro. Sempre com texto/ícone junto (nunca só cor).
- **Vazio e erro:** todo estado vazio tem título + 1 linha + CTA (ex: "Nenhum serviço ainda" → "Cadastrar primeiro serviço"). Erros dizem o que aconteceu e o que fazer, sem tom de desculpa.

## 7. Texto de interface (pt-BR)

- Sentence case ("Confirmar horário", nunca "Confirmar Horário").
- Verbo primeiro nos botões: "Agendar horário", "Salvar alterações", "Enviar lembrete".
- Voz do sistema, não do robô: "Horário confirmado", não "Eu confirmei seu horário".
- Sem "por favor", sem "simplesmente", sem exclamação em mensagens do sistema.
- Dinheiro: `R$ 45` (sem centavos quando .00), `R$ 37,50` quando houver. Datas: "qui, 16 de julho".

## 8. Layout e responsividade

- **Página pública é mobile-first** (maioria absoluta dos agendamentos virá do celular). Desktop = coluna central máx. 560px.
- **Painel é desktop-first** com sidebar fixa; no mobile vira bottom-nav com 4 itens (Agenda, Clientes, Financeiro, Mais).
- Grid de espaçamento em múltiplos de 4px. Respiro generoso: seções separadas por 32–48px.
- A tela de Agenda é a mais importante do produto: colunas por profissional, blocos de agendamento com nome do cliente + serviço, drag para reagendar (fase 2). Priorizar legibilidade sobre densidade.

## 9. Acessibilidade e qualidade (checklist por tela)

- Contraste AA em todo texto (atenção: latão sobre marfim NÃO passa para texto pequeno — usar latão só em elementos grandes/decorativos no tema claro; texto de acento no claro usa `--latao-escuro`).
- Foco visível por teclado em tudo que é interativo.
- `prefers-reduced-motion` respeitado; animações apenas funcionais (transição de 150–200ms em hover/abertura), nada decorativo.
- Área de toque mínima 44×44px no mobile.

## 10. O que é proibido (anti-padrões)

- Gradientes, glassmorphism, sombras coloridas, glow, emoji em UI.
- Mais de um acento por tela; latão como cor de fundo de seções inteiras.
- Fontes fora das duas definidas; peso 600+.
- Ícones de bibliotecas mistas — padronizar **Lucide** (traço 1.5px, combina com o traço fino do sistema).
- Barber pole literal, tesourinhas e navalhas como decoração espalhada. A referência ao ofício está na paleta e no fio, não em clipart.
