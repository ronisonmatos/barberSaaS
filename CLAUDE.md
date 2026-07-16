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
- Próxima onda da Fase 1 (ver seção 8 da ORIENTACAO-BARBERSAAS.md): billing da plataforma via Asaas
  (aguardando decisão do usuário sobre gateway — seção 13, item 3), painel admin mínimo, e WhatsApp
  (Cloud API + links wa.me) por último, como o usuário pediu.
