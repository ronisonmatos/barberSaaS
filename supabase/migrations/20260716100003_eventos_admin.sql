-- Log de auditoria das acoes do super_admin (mudanca de status manual, troca de plano,
-- criacao manual de estabelecimento). Tambem serve de fonte para metricas de cancelamento.

create table eventos_admin (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid references estabelecimentos(id) on delete set null,
  super_admin_id uuid not null references usuarios(id),
  tipo text not null,
  detalhes jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index idx_eventos_admin_estabelecimento on eventos_admin (estabelecimento_id, created_at desc);
create index idx_eventos_admin_tipo_data on eventos_admin (tipo, created_at desc);

alter table eventos_admin enable row level security;

create policy "somente super_admin le e escreve eventos_admin" on eventos_admin for all
  using (eh_super_admin())
  with check (eh_super_admin());
