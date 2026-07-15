# BarberSaaS

SaaS multi-tenant para barbearias. Leia ORIENTACAO-BARBERSAAS.md antes de qualquer tarefa.

## Regras
- Multi-tenant por barbearia_id + RLS. Toda tabela nova: coluna barbearia_id + políticas RLS + teste de isolamento.
- Dinheiro em centavos (int). Datas em timestamptz UTC; timezone da barbearia na exibição.
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
- Fase 1, onda 1 (núcleo de agendamento): concluída — auth + onboarding (RPC `onboarding_criar_barbearia`,
  trigger `handle_new_user`), CRUDs do painel (serviços, profissionais+jornadas+vínculo de serviços,
  bloqueios, clientes), RPC `slots_disponiveis` com testes em `supabase/tests/slots_disponiveis.sql`,
  agenda do painel (dia/semana, agendamento manual, cancelar/concluir/no-show), página pública
  `/b/{slug}` + fluxo de agendamento (modo `no_local`, via RPC `criar_agendamento_publico`) + página de
  gerenciamento por token (`/b/{slug}/meus-agendamentos/{token}`, ver+cancelar). `middleware.ts` foi
  renomeado para `proxy.ts` (convenção do Next.js 16). Fluxo completo validado ponta a ponta.
  Simplificações assumidas: 1 barbearia por owner, sem troca de barbearia ativa; sem "remarcar" (só
  cancelar); sem rate limiting real na RPC pública; visão "semana" da agenda é uma lista simplificada,
  não um grid completo.
- Próxima onda da Fase 1 (ver seção 8 da ORIENTACAO-BARBERSAAS.md): billing da plataforma via Asaas
  (aguardando decisão do usuário sobre gateway — seção 13, item 3), painel admin mínimo, e WhatsApp
  (Cloud API + links wa.me) por último, como o usuário pediu.
