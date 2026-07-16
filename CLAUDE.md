# BarberSaaS

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
- Próxima onda da Fase 1 (ver seção 8 da ORIENTACAO-BARBERSAAS.md): terminar de testar a cobrança Pix
  com credenciais reais, cartão via Mercado Pago, Asaas, e WhatsApp (Cloud API + links wa.me) por
  último, como o usuário pediu.
