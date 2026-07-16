-- Fila de suporte: estabelecimentos abrem chamados, super_admin responde e gerencia status.

create type status_ticket as enum ('aberto', 'em_andamento', 'resolvido');

create table tickets_suporte (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  aberto_por uuid not null references usuarios(id),
  assunto text not null,
  status status_ticket not null default 'aberto',
  created_at timestamptz not null default now()
);
create index idx_tickets_suporte_estabelecimento on tickets_suporte (estabelecimento_id, created_at desc);

create table tickets_suporte_mensagens (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets_suporte(id) on delete cascade,
  autor_id uuid not null references usuarios(id),
  mensagem text not null,
  created_at timestamptz not null default now()
);
create index idx_tickets_suporte_mensagens_ticket on tickets_suporte_mensagens (ticket_id, created_at);

alter table tickets_suporte enable row level security;
alter table tickets_suporte_mensagens enable row level security;

create policy "membros leem tickets do proprio estabelecimento" on tickets_suporte for select
  using (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin());

create policy "membros abrem tickets do proprio estabelecimento" on tickets_suporte for insert
  with check (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin());

create policy "membros e super_admin atualizam status do ticket" on tickets_suporte for update
  using (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin())
  with check (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin());

create policy "membros leem mensagens dos proprios tickets" on tickets_suporte_mensagens for select
  using (
    exists (
      select 1 from tickets_suporte t
      where t.id = tickets_suporte_mensagens.ticket_id
        and (t.estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin())
    )
  );

create policy "membros escrevem mensagens nos proprios tickets" on tickets_suporte_mensagens for insert
  with check (
    exists (
      select 1 from tickets_suporte t
      where t.id = tickets_suporte_mensagens.ticket_id
        and (t.estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin())
    )
  );
