-- Sistema de notificacoes do painel: primeira feature do projeto usando Supabase Realtime.
-- tipo/payload jsonb genericos de proposito (mesmo espirito de eventos_admin) para nao precisar
-- de migration nova a cada tipo de notificacao futuro -- por enquanto so 'fidelidade_completo'.

create table notificacoes (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  tipo text not null,
  titulo text not null,
  descricao text,
  payload jsonb not null default '{}',
  lida boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notificacoes_estabelecimento on notificacoes (estabelecimento_id, lida, created_at desc);

alter table notificacoes enable row level security;

create policy "membros leem notificacoes" on notificacoes for select
  using (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin());

-- So UPDATE (marcar como lida) para membros -- a unica escrita de criacao acontece dentro de
-- atualizar_status_agendamento (security definer, roda como dono da funcao, nao precisa de
-- policy de insert).
create policy "membros marcam notificacoes como lidas" on notificacoes for update
  using (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin())
  with check (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin());

alter publication supabase_realtime add table notificacoes;
