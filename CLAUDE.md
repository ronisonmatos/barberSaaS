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
- Fase: 0 (fundação) concluída — Next.js + Tailwind + TS criado, Supabase linkado ao projeto remoto
  `smphmeoljjgakghsnvpb`, migrations (enums, núcleo, domínio, RLS) aplicadas, seed com 1 barbearia demo,
  clients Supabase (browser/server/service-role) criados, CI básico (lint+typecheck).
- Próxima tarefa: Fase 1 (ver checklist na ORIENTACAO-BARBERSAAS.md seção 8) — auth/onboarding da
  barbearia, CRUDs, RPC `slots_disponiveis`, página pública de agendamento, agenda do painel, billing
  Asaas, WhatsApp, painel admin mínimo.
