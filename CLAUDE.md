# Comptus

SaaS multi-tenant para barbearias e salões de beleza. Leia ORIENTACAO-BARBERSAAS.md antes de qualquer tarefa.
Toda tela nova (ou alterada) segue DESIGN.md ("Navalha & Latão") — paleta, tipografia, componentes,
temas por tenant na página pública, texto de interface e acessibilidade.

## Regras
- Multi-tenant por estabelecimento_id + RLS. Toda tabela nova: coluna estabelecimento_id + políticas RLS + teste de isolamento.
- Dinheiro em centavos (int). Datas em timestamptz UTC; timezone do estabelecimento na exibição.
- Pagamentos/ativações só mudam de status via webhook idempotente (webhook_eventos).
- Nunca usar service_role no client. Nunca commitar .env.
- Schema muda só via supabase/migrations (nunca editar o banco direto).

## Comandos
- `cd web && npm run dev` — Next.js
- `supabase db push` — aplica migrations no projeto remoto (smphmeoljjgakghsnvpb)
- `supabase db push --include-seed` — aplica migrations + seed.sql
- `supabase gen types typescript --linked > web/lib/supabase/types.ts` — regenerar tipos após mudar o schema
- `cd web && npm run lint && npm run typecheck` — rodar antes de finalizar qualquer tarefa

## Estado atual
- Fase 0 (fundação): concluída.
- Fase 1, onda 1 (núcleo de agendamento): concluída — auth + onboarding (RPC `onboarding_criar_estabelecimento`,
  trigger `handle_new_user`), CRUDs do painel (serviços, profissionais+jornadas+vínculo de serviços,
  bloqueios, clientes), RPC `slots_disponiveis` com testes em `supabase/tests/slots_disponiveis.sql`,
  agenda do painel (dia/semana, agendamento manual, cancelar/concluir/no-show), página pública
  `/b/{slug}` + fluxo de agendamento (modo `no_local`, via RPC `criar_agendamento_publico`) + página de
  gerenciamento por token (`/b/{slug}/meus-agendamentos/{token}`, ver+cancelar). `middleware.ts` foi
  renomeado para `proxy.ts` (convenção do Next.js 16). Fluxo completo validado ponta a ponta.
  Simplificações assumidas: 1 estabelecimento por owner, sem troca de estabelecimento ativo; sem
  "remarcar" (só cancelar); sem rate limiting real na RPC pública; visão "semana" da agenda é uma lista
  simplificada, não um grid completo.
- Fase 1, onda 1.5 (limpeza visual + generalização de vertical): concluída — kit de UI mínimo em
  `web/components/ui/` (Button, Input, Card, Heading, FormError), correção de bug de fonte (Arial
  sobrescrevia Geist), sidebar responsiva com link ativo, grid da agenda sem estilo inline. Rename
  completo de "barbearia" para "estabelecimento" (banco + código) para refletir que o produto atende
  barbearias e salões de beleza: tabelas `estabelecimentos`/`membros_estabelecimento`/
  `planos_estabelecimento`, coluna `estabelecimento_id`, RPCs e políticas RLS renomeadas via migrations
  `20260715200001` a `20260715200004`. Jornada semanal do profissional redesenhada (checkbox por dia
  em vez de "+ adicionar" escondido, com "copiar segunda para terça-sexta").
- Recuperação do link de gerenciamento do cliente final (`token_acesso`, ver seção 11 da
  ORIENTACAO-BARBERSAAS.md — "permitir regenerar"): stopgap implementado — o token é salvo no
  localStorage do navegador ao concluir o agendamento (`meu-agendamento-link.tsx`), com um link "Já
  tenho agendamento" na página pública `/b/{slug}`. Só cobre o mesmo aparelho/navegador. A solução
  completa (cliente digita o telefone, sistema reenvia o link mágico por WhatsApp, nunca exibido na
  tela) fica pendente até a integração com WhatsApp Cloud API (próxima onda, por último).
- Painel de monitoramento (`/app`, antes era só um redirect para `/app/agenda`): concluído — 5 KPIs
  (Agendados/Atendidos/A atender/Cancelados/Não compareceram) + gráfico de barras por status + gráfico
  de linha de volume diário, com filtro de período (Hoje/7 dias/30 dias). Usa `recharts` (nova
  dependência). Cores reaproveitam os tokens de `StatusBadge`; agregação feita em JS a partir de uma
  query simples em `agendamentos` (sem RPC nova — volume baixo o suficiente por enquanto). "Painel"
  adicionado à sidebar (`app-nav.tsx`) e ao menu "Mais" do bottom-nav mobile.
- **Painel admin da plataforma (`/admin`)**: concluído — visão geral (contagem por status, MRR
  estimado, cancelamentos/30d), lista+detalhe de estabelecimentos (ativar/suspender/cancelar via
  `ativacao_manual`, trocar plano, contadores de uso), cadastro manual de estabelecimento com convite
  por e-mail real (`auth.admin.inviteUserByEmail`, service-role — único lugar do app que usa
  service-role client-side de verdade), CRUD de planos da plataforma, e fila de suporte completa
  (`tickets_suporte`/`tickets_suporte_mensagens`, telas em `/admin/suporte` e `/app/suporte`,
  componente compartilhado `components/ticket-thread.tsx`). Log de auditoria em `eventos_admin`
  (super_admin only) registra mudança de status/plano e criação manual — é a fonte da métrica de
  cancelamentos.
  - **Corrigido durante essa leva (achado de segurança real)**: a policy de update de `usuarios` só
    checava `id = auth.uid()`, sem proteger a coluna `papel` — qualquer usuário conseguia se
    auto-promover a `super_admin` pelo client. Agora um trigger (`proteger_papel_usuario`) bloqueia
    mudança de papel por quem não é super_admin, com bypass explícito para `service_role`
    (`auth.role() = 'service_role'`) — sem esse bypass, nem o bootstrap do primeiro super_admin
    funcionava. Validado com script contra o banco real (usuário comum bloqueado, isolamento de
    tickets entre estabelecimentos confirmado).
  - Não construído agora (ver plano salvo em `.claude/plans` desta leva se precisar retomar):
    impersonate, MRR/churn real (depende do Asaas), paginação da lista de estabelecimentos.
  - **Bootstrap do primeiro super_admin: feito.** `ronisonmaria@gmail.com` é `super_admin`.
- **Configurações do estabelecimento (`/app/configuracoes`)**: concluído — perfil (nome + upload de
  logo pro bucket público `logos`, path `{estabelecimento_id}/logo.<ext>`, mostrado também na página
  pública `/b/{slug}`), configuração de gateway de pagamento (Mercado Pago ou Asaas, **credenciais
  próprias do estabelecimento** — não é subconta/split gerenciado pela plataforma, decisão explícita
  do usuário; `estabelecimento_pagamento_config`, acesso só do `owner`, staff não vê, credenciais
  mascaradas na tela e nunca reenviadas cruas ao client) e um card com link para `/app/suporte`
  ("Suporte" saiu do menu principal, mora dentro de Configurações agora).
- **Cobrança real via Pix (Mercado Pago)**: código concluído, **verificação de ponta a ponta ainda
  bloqueada por dois pré-requisitos do usuário** (credenciais de sandbox do Mercado Pago + deploy na
  Vercel, já que webhook exige URL pública). O que existe:
  - `estabelecimento_pagamento_config` ganhou `aceita_pagamento_antecipado`, `aceita_pagamento_no_dia`,
    `mercado_pago_webhook_secret`. Tela de Configurações → Pagamentos atualizada com os dois
    checkboxes + campo do webhook secret + a URL do webhook pra colar no painel do Mercado Pago.
  - RPCs públicas novas: `criar_agendamento_publico_pix` (cria agendamento+pagamento `pendente`,
    exige e-mail do cliente), `status_pagamento_publico` (polling scoped por token),
    `formas_pagamento_publico` (expõe só o que é seguro mostrar no público: flags + public key).
  - `web/lib/mercadopago.ts`: criação de cobrança Pix + verificação de assinatura do webhook
    (`x-signature`/HMAC-SHA256, manifesto `id:...;request-id:...;ts:...;` — fórmula confirmada na
    documentação oficial via WebFetch, não foi advinhada).
  - `app/api/webhooks/mercadopago/route.ts`: localiza o pagamento pelo `gateway_payment_id` (é assim
    que descobre de qual estabelecimento é a notificação, já que cada um usa a própria conta MP),
    valida assinatura com o secret daquele estabelecimento, reconsulta status na API antes de
    confirmar, idempotência via `webhook_eventos`.
  - `app/api/cron/expirar-pendentes/route.ts` + `web/vercel.json`: cancela Pix pendente há +15min,
    protegido por `CRON_SECRET` (já gerado e está no `.env.local`; **precisa configurar a mesma
    variável no projeto da Vercel** quando fizer o deploy).
  - Wizard de agendamento público (`agendar-wizard.tsx`): passo novo de forma de pagamento (só
    aparece se o estabelecimento aceitar as duas formas), e-mail obrigatório só no fluxo Pix, tela de
    QR code com polling (a cada 4s) até o webhook confirmar.
  - Validado sem credenciais reais: RLS/bloqueio da RPC sem config ativa, `status_pagamento_publico`
    scoped por token, matemática da assinatura HMAC, query de expiração do cron — tudo contra o
    Supabase real. **Falta testar de ponta a ponta com Pix de verdade** assim que houver credenciais
    de sandbox + deploy.
  - Cartão (Mercado Pago) e Asaas ficam para levas seguintes, como combinado.
- **Logo consistente em todas as telas**: adicionado ao sidebar/topbar mobile do painel
  (`web/app/(app)/app/layout.tsx`) e a um header compartilhado novo em
  `web/app/(public)/b/[slug]/layout.tsx` (logo + nome, linkando pra home), que agora cobre
  automaticamente todas as páginas públicas (home, agendar, meus-agendamentos) sem precisar repetir
  em cada uma. Removida a logo duplicada que estava só na home pública.
- **Deploy Vercel em andamento**: projeto em `https://barber-saa-s-silk.vercel.app`, mas atingiu o
  limite diário de deploys antes de publicar o commit com admin/dashboard/configurações/pagamento —
  o site em produção ainda está numa versão anterior (rotas `/api/webhooks/mercadopago` e
  `/api/cron/expirar-pendentes` dão 404 lá). **Precisa de um redeploy manual quando o limite
  resetar.**
- **Teste de Pix em produção (Mercado Pago)**: usuário criou uma aplicação nova no Mercado Pago
  (separada da produção do app SantosPlay, para não conflitar webhook) e configurou credenciais de
  **produção** (não sandbox) no estabelecimento "Clube do Homem" (`2734be2f-0b35-46bc-92ac-cd595cc08f83`).
  Teste em andamento localmente: cria-se o Pix real via `/b/clube-do-homem/agendar`, paga-se de
  verdade, e a confirmação (que normalmente viria do webhook) é feita manualmente por script
  consultando a API do Mercado Pago diretamente — combinado porque o webhook só funciona com URL
  pública (bloqueado pelo item acima). Recomendável ao usuário resetar essas credenciais no painel do
  Mercado Pago depois dos testes, já que passaram pelo chat.
- **Cartão de crédito via Mercado Pago (Payment Brick)**: concluído. Tokenização acontece no
  navegador do cliente (SDK `https://sdk.mercadopago.com/js/v2`, carregado via `next/script` só no
  passo de cartão) — nosso servidor nunca vê o número do cartão, só o token. Fluxo: `criar_agendamento_publico_pix`
  generalizada (`p_metodo` novo, default `'pix'`, aceita `'cartao'` — sem quebrar quem já chamava sem
  esse parâmetro); `web/lib/mercadopago.ts` ganhou `criarCobrancaCartao`; CPF vira obrigatório só
  nesse fluxo (`web/lib/cpf.ts`, com dígito verificador). Diferente do Pix, cartão responde na hora:
  aprovado confirma o agendamento na mesma chamada, recusado cancela e libera o horário, em
  processamento fica pendente aguardando o mesmo webhook/RPC de status já usados pelo Pix (nada mudou
  no webhook — ele já era genérico por tipo de notificação). Restrito a **crédito** (não débito), sem
  UI custom de parcelas (o próprio Brick já oferece isso). Validado contra o Supabase real sem gastar
  dinheiro (RPC generalizada testada com `p_metodo='cartao'` e com o default `'pix'`); a tokenização em
  si só é testável no navegador.
- **Rebranding para Comptus**: concluído. Logo (`web/public/brand/`, 4 SVGs claro/escuro ×
  logotipo/símbolo) aplicada em `/login`+`/signup`, `/admin` (sidebar + header mobile) e favicon
  (`web/app/icon.svg`); `/app` (painel do estabelecimento) e `/b/{slug}` continuam com a marca do
  **tenant** (é white-label de propósito), só ganharam um rodapé "Powered by Comptus" discreto.
  Rodapé de copyright compartilhado em `web/components/brand-footer.tsx`.
- **Responsividade 100%**: auditado com Playwright (375/768/1280px) nas 23 telas do app. Achados
  reais corrigidos: `/admin` não tinha nenhuma navegação no celular (sidebar `hidden md:flex` sem
  substituto — criado `admin-bottom-nav.tsx` espelhando o padrão do `/app`); vazamento horizontal em
  `/admin` e `/app` por `min-width: auto` de item flex (faltava `min-w-0` na cadeia de containers);
  as 8 tabelas do app não tinham `overflow-x-auto`; `StatTile` cortava rótulos longos sem espaço
  (`min-w-0` + `break-words`); grade semanal da agenda (`grid-cols-7` fixo) virava texto ilegível no
  celular — agora é lista de 1 coluna abaixo de `md`.
- **Reembolso de agendamento pago (Mercado Pago)**: concluído, escopo deliberadamente pequeno —
  reembolso é **manual** (o dono clica "Reembolsar" no card do agendamento em `/app/agenda`),
  **não automático**, e **sem sistema de saldo/crédito** (decisão explícita: "não compareceu" e
  "cliente cancelou com antecedência" são calls de negócio diferentes que exigiriam política de
  cancelamento configurável por estabelecimento — fica pra quando houver volume real). Só aparece
  pra agendamento `cancelado`/`no_show` com pagamento `pago` via `pix`/`cartao` (owner-only, staff
  não vê o botão). `web/lib/mercadopago.ts` ganhou `estornarPagamento` (chama
  `/v1/payments/{id}/refunds`); a ação em `web/app/(app)/app/agenda/actions.ts` só *solicita* o
  estorno — o status do pagamento continua mudando **só via webhook** (regra do projeto), então o
  webhook (`app/api/webhooks/mercadopago/route.ts`) ganhou o branch `status === "refunded"` →
  `estornado` (esse status já existia no enum `status_pagamento`, não precisou migration). UI mostra
  "reembolso solicitado, aguardando confirmação" logo após o clique, sem fingir que já confirmou.
  Não testado ponta a ponta com reembolso real (evitado deliberadamente pra não mexer em dinheiro de
  verdade da "Clube do Homem" em produção) — validado por leitura de código + typecheck/lint +
  navegação real na agenda confirmando que o botão não aparece quando não deveria.
- **Convite de usuários da equipe com limite por plano** (`/app/configuracoes`): concluído.
  `planos_plataforma` ganhou `max_usuarios` (nullable = ilimitado, mesma convenção de
  `max_profissionais`; migration `20260716150001` já seta Essencial=2, Pro=5 e é editável no
  `/admin/planos`). Estabelecimento sem plano atribuído (trial/free — `plano_plataforma_id` null,
  não existe linha "Free" em `planos_plataforma` hoje) cai no fallback hardcoded de 1 usuário
  (`LIMITE_USUARIOS_SEM_PLANO`, duplicado em `configuracoes/actions.ts` e `configuracoes/page.tsx`
  de propósito — são só leituras, não vale abstrair uma constante compartilhada pra isso ainda).
  Novo componente `equipe-form.tsx`: lista membros (nome + papel), "X de Y usuários usados",
  convite por e-mail (reusa o padrão de `auth.admin.inviteUserByEmail` já usado no cadastro manual
  do admin) bloqueado quando o limite é atingido, remover membro (não remove o próprio dono). Tudo
  **owner-only** — staff não vê o card.
  - **Corrigido de passagem (achado de segurança real, mesma classe do bug de `usuarios.papel`
    de uma leva anterior)**: a policy de escrita em `membros_estabelecimento` usava
    `meus_estabelecimentos()`, que retorna o estabelecimento pra qualquer papel — ou seja, **staff
    conseguia inserir/remover vínculos direto via client**, inclusive se auto-promover a `owner` ou
    remover o dono de verdade. Trocado por `estabelecimentos_que_possuo()` (só papel `owner`),
    `security definer` pra não recursar na RLS da própria tabela (mesmo motivo de
    `meus_estabelecimentos()` já ser `security definer`).
  - Validado contra o Supabase real: card renderiza certo (`1 de 2 usuários usados` pra Clube do
    Homem, que está no plano Essencial), tabela de planos do admin mostra/edita a coluna nova. **Não
    testei o clique em "Convidar" de verdade** — dispara e-mail de convite real via Supabase Auth
    pro endereço digitado, então isso fica pra você testar com um e-mail seu.
- **Página pública redesenhada — layout "1A Clássico"**: concluído, a partir de um handoff de
  design em HTML (usuário escolheu a opção 1A entre 3 variações). As cores do handoff (OKLCH
  fixos) foram **descartadas de propósito** — a implementação usa os tokens `--tenant-*` que já
  existiam (`web/app/(public)/b/[slug]/estilos.ts` novo, com `BOTAO_PRIMARIO`/`BOTAO_SECUNDARIO`/
  `BOTAO_GHOST`/`ROTULO_SECAO` compartilhados entre a home e o wizard de agendar), então a página
  continua se adaptando aos 3 presets de tema por tenant, como sempre. Card único (max-width
  480px) com hero (logo circular + nome + frase curta + CTAs), galeria de fotos, Sobre,
  Horário/Endereço, Serviços, Profissionais e rodapé Instagram/WhatsApp (wa.me a partir do
  `telefone_whatsapp` que já existia — só o link, não é a integração de WhatsApp Cloud API que
  ainda está na fila). Todas as seções novas somem graciosamente quando o campo está vazio (não
  aparecem placeholders "Adicione uma foto" pro visitante público — isso só existe no editor).
  - Campos novos aproveitando o que já existia: `descricao` (já existia) virou a frase curta do
    hero; `endereco` (jsonb `{rua,numero,bairro,cidade,uf,cep}`, já existia na tabela desde a Fase
    0 mas nunca tinha UI) agora tem formulário em Configurações. Só 3 colunas de fato novas:
    `sobre`, `horario_texto` (texto livre, não é calculado a partir das jornadas dos
    profissionais — decisão deliberada de manter simples), `instagram_url`.
  - **Galeria de fotos com limite por plano**: mesmo padrão de `max_usuarios` (onda anterior) —
    `planos_plataforma.max_fotos` (Essencial=10, Pro=20, sem plano=5 via fallback hardcoded).
    Reusa o bucket `logos` existente com prefixo `{estabelecimento_id}/galeria/` em vez de criar
    bucket novo (as policies já são por path, não por bucket dedicado). Nova tabela
    `estabelecimento_fotos` com RLS pública de leitura (só de estabelecimento ativo/trial, mesmo
    padrão de `servicos`/`profissionais`) e gerenciamento por qualquer membro (não é owner-only —
    mesma régua do card "Perfil", que também nunca foi owner-only).
  - Corrigido o header duplicado: a home antiga tinha um header compartilhado (logo+nome) em
    `layout.tsx` que agora conflitava com o hero do card. Virou `estabelecimento-header.tsx`
    (client component com `usePathname()`) que se esconde especificamente na home — continua
    aparecendo em `/agendar` e `/meus-agendamentos/{token}`, que não têm hero próprio.
  - Validado contra o Supabase real: usei a própria tela de Configurações da Clube do Homem pra
    preencher os campos novos de verdade, tirei screenshot da home pública com tudo populado
    (bateu exatamente com o handoff, só que nas cores do tema do tenant), e reverti os campos
    pra vazio de novo depois — não ficou dado de teste no perfil real deles.
- **Plano Free + downgrade automático pós-trial**: concluído. Linha real `Free` em
  `planos_plataforma` (R$0, 1 profissional, 1 usuário, 3 fotos, `recursos.suporte = "limitado"`)
  substituindo o fallback hardcoded que existia só em código. Novo cron
  `web/app/api/cron/expirar-trial/route.ts` (diário, `web/vercel.json`) mexe `status='trial'` com
  `trial_ate` vencido (e `ativacao_manual=false`, respeitando trava do super_admin) para
  `status='ativa'` + plano Free.
  - RPC nova `aplicar_limites_plano(estabelecimento_id)` (security definer) reconcilia
    profissionais/membros/fotos com o limite do plano atual sempre que `plano_plataforma_id` muda —
    chamada pelo cron, por `alterarPlanoEstabelecimento` (admin) e por `confirmarPagamentoPlataforma`
    (upgrade real via Pix/cartão da assinatura da plataforma). Mantém ativos os mais antigos
    (`created_at`/`ordem`) até o limite; excedentes viram `ativo=false,
    desativado_por_limite_plano=true` (nunca deletados). Se o limite aumentar depois, tudo que foi
    desativado **pela função** reativa automaticamente — mas nunca mexe em algo que o dono desativou
    manualmente (`ativo=false, desativado_por_limite_plano=false`), essa distinção é o que permite
    diferenciar "a plataforma desligou por causa do limite" de "o dono desligou de propósito".
    Validado com script transacional (`supabase/tests/aplicar_limites_plano.sql`, sempre com
    `rollback`) cobrindo os 3 cenários: downgrade pro Free desativando os mais novos, proteção do
    item desativado manualmente, e reativação automática num upgrade pra Pro.
  - Fechado um gap de segurança de negócio pré-existente: `max_profissionais` nunca era checado em
    lugar nenhum (só decorativo no card do plano) — agora `profissionais/actions.ts` bloqueia
    criação/reativação acima do limite, mesmo padrão já usado por `max_usuarios`/`max_fotos`.
  - `membros_estabelecimento` ganhou `ativo`/`desativado_por_limite_plano`/`created_at` (não tinha
    nenhum dos três). Membro desativado perde acesso a **toda** a RLS multi-tenant, não só ao
    painel: `meus_estabelecimentos()`/`estabelecimentos_que_possuo()` (usadas por quase toda policy
    de domínio) agora exigem `ativo`. Precisou de uma policy extra (`membros leem o proprio
    vinculo`) pra ele continuar enxergando o próprio vínculo e cair na tela nova
    `/conta-desativada` em vez de `/onboarding`. `estabelecimento_fotos` ganhou as mesmas duas
    colunas de controle; a RLS pública e a página `/b/{slug}` passaram a filtrar por `ativo`.
  - Owner nunca é desativado por este mecanismo (mas consome a vaga de `max_usuarios` como
    qualquer usuário).
  - Admin (`/admin/planos`) ganhou os campos que faltavam no formulário (`max_fotos` não era nem
    exposto nem persistido antes disso) e um seletor de suporte limitado/prioritário.
- **Pagamento online como recurso de plano**: concluído. `recursos.pagamento_online` (Free=false,
  Essencial/Pro=true; durante o trial sem plano atribuído continua liberado). Nova função
  `estabelecimento_permite_pagamento_online(id)` usada em dois pontos: `formas_pagamento_publico`
  zera `aceita_pagamento_antecipado` pro público mesmo que a config salva diga `true` (não apaga a
  config do dono, só bloqueia a exposição — `aceita_pagamento_no_dia` não é afetado, já que pagar no
  dia não depende de gateway); e `criar_agendamento_publico_pix` repete a mesma checagem como
  barreira de servidor (a UI escondendo a opção não impede alguém de chamar a RPC direto). Em
  `/app/configuracoes/pagamentos`, se o plano não permite, o formulário nem aparece — só um aviso
  com link pra `/app/configuracoes/plano`. Validado com script transacional
  (`supabase/tests/gate_pagamento_online.sql`, sempre com `rollback`).
- **Loja de produtos**: concluído. Estabelecimento cadastra produtos (`/app/produtos`, 1 foto por
  produto reaproveitando o bucket `logos` com prefixo `/produtos/`, com controle de estoque
  numérico) e o cliente compra na página pública, avulso ou junto com um serviço agendado (um
  pagamento só). Só retirada no local por enquanto.
  - Recurso de plano pago, mesmo padrão de `pagamento_online`: `recursos.loja` (Free=false +
    `max_produtos=0`, Essencial/Pro=true) + `estabelecimento_permite_loja(id)`, checada na RLS
    pública de `produtos` e de novo dentro das RPCs de compra (defesa em profundidade). Free com
    `max_produtos=0` faz a extensão de `aplicar_limites_plano` desativar todos os produtos no
    downgrade (não só esconder do público — ficam genuinamente inativos em `/app/produtos` também),
    reativando automaticamente num upgrade, mesma regra já usada por profissionais/fotos/membros.
  - Schema novo: `produtos` (com `desativado_por_limite_plano`, mesmo mecanismo de
    profissionais/fotos), `pedidos` (com `agendamento_id` opcional pra compra combinada) e
    `pedido_itens` (preço/nome congelados no ato); `pagamentos` ganhou `pedido_id` como mais uma FK
    opcional (mesmo padrão de `agendamento_id`/`assinatura_cliente_id`) — uma compra combinada seta
    as duas FKs na mesma linha de pagamento.
  - Estoque: `UPDATE produtos SET estoque = estoque - qtd WHERE estoque >= qtd` dentro da transação
    da RPC de compra (sem lock explícito, o próprio UPDATE condicional já serializa concorrência);
    se faltar estoque de qualquer item, a RPC inteira aborta e nada é persistido. Devolvido
    automaticamente quando um pedido é cancelado (webhook do Mercado Pago, cron de expiração de
    +15min, ou cancelamento manual em `/app/pedidos`) via `web/lib/estoque.ts`.
  - RPCs: `criar_pedido_publico`/`criar_pedido_publico_pix` (compra avulsa, espelham as RPCs de
    agendamento sem a parte de slot/profissional/serviço) e `criar_agendamento_publico`/
    `criar_agendamento_publico_pix` ganharam um `p_itens jsonb` opcional pra compra combinada
    (precisou `drop function` explícito antes do `create`, já que mudar a lista de parâmetros cria
    sobrecarga em vez de substituir — mesmo motivo documentado em `20260716140001_metodo_cartao.sql`).
    `status_pagamento_publico` foi generalizada (`left join` em vez de `join` obrigatório) pra
    cobrir pagamento de pedido avulso sem agendamento.
  - UI pública: home ganha uma seção compacta "Produtos" (poucos itens + link "Ver loja") só quando
    há produtos — nada aparece se o plano não permitir loja, a RLS já garante isso na origem;
    catálogo completo + carrinho + checkout moram em `/b/{slug}/loja` (rota nova); o wizard de
    agendar ganhou um passo opcional "Quer levar algum produto?" entre data/hora e forma de
    pagamento. Extraídos dois componentes compartilhados entre os dois wizards:
    `carrinho-produtos.tsx` (stepper de quantidade) e `resultado-pagamento.tsx` (telas de QR Pix/
    processando/confirmado, que antes só existiam duplicadas dentro do `agendar-wizard.tsx`).
    `/b/{slug}/meus-agendamentos/{token}` ganhou uma seção "Meus pedidos" (RPC nova
    `pedido_por_token`, mesmo token do cliente).
  - `/app/pedidos`: gestão de retirada (marcar retirado / cancelar com devolução de estoque).
  - Validado com script transacional (`supabase/tests/loja.sql`, sempre com `rollback`): gate por
    plano, compra avulsa decrementando estoque, bloqueio por estoque insuficiente sem efeito
    colateral, downgrade/upgrade via `aplicar_limites_plano`, e compra combinada vinculando o
    pedido ao agendamento com estoque decrementado corretamente.
- **Cadastro de produto mais intuitivo + tags/SEO**: concluído. `/app/produtos` reorganizado em
  seções (dados básicos, foto com preview local antes de salvar, descrição, tags, SEO), formulário
  antes era um bloco único sem preview de nada. `produtos` ganhou `tags text[]`, `slug` (único por
  `estabelecimento_id`, auto-gerado do nome via `slugify` já existente em `lib/slug.ts`, com
  sufixo numérico em caso de colisão — resolvido em código, não em SQL), `meta_titulo` e
  `meta_descricao`.
  - Nova página pública `/b/{slug}/loja/{produto}` (por decisão explícita do usuário: campo de SEO
    sem página própria não serve pra nada) com `generateMetadata` (título/descrição/Open Graph
    usando os campos de SEO com fallback pro nome/descrição) e dados estruturados JSON-LD
    (`schema.org/Product`, com `availability` a partir do estoque) — é o que o Google de fato usa
    pra indexar/rich snippet, diferente da meta tag "keywords" que o Google já ignora há mais de 10
    anos (por isso as tags viraram um campo visível de organização, não uma keyword invisível).
  - Teaser de produtos na home passou a linkar pra página individual do produto (antes ia direto
    pra `/loja`); a página do produto tem um botão "Comprar" que leva pra `/b/{slug}/loja?
    adicionar={id}` — a loja lê esse parâmetro e já entra com 1 unidade no carrinho.
  - Validado com script transacional (`supabase/tests/produtos_slug.sql`): índice único bloqueia
    slug duplicado dentro do mesmo estabelecimento, mas permite o mesmo slug em estabelecimentos
    diferentes.
- Próxima onda da Fase 1 (ver seção 8 da ORIENTACAO-BARBERSAAS.md): terminar o deploy/webhook de
  verdade, Asaas, e WhatsApp (Cloud API + links wa.me) por último, como o usuário pediu.
