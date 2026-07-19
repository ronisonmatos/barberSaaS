-- Cartao fidelidade: estabelecimento configura, por servico, quantos selos completam o cartao e
-- qual o brinde (servico ou produto do catalogo). Selo so e concedido quando o agendamento e
-- marcado concluido (nunca no ato de agendar/pagar) -- a RPC que faz isso vem na migration
-- seguinte. Resgate e uma acao manual do painel (nao ha fluxo publico nesta leva).

create table programas_fidelidade (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  nome text not null,
  servico_id uuid not null references servicos(id),
  selos_necessarios int not null check (selos_necessarios between 2 and 50),
  brinde_tipo text not null check (brinde_tipo in ('servico', 'produto')),
  brinde_servico_id uuid references servicos(id),
  brinde_produto_id uuid references produtos(id),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  check (
    (brinde_tipo = 'servico' and brinde_servico_id is not null and brinde_produto_id is null) or
    (brinde_tipo = 'produto' and brinde_produto_id is not null and brinde_servico_id is null)
  )
);
create index idx_programas_fidelidade_estabelecimento on programas_fidelidade (estabelecimento_id);

create table cartoes_fidelidade (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete cascade,
  programa_id uuid not null references programas_fidelidade(id) on delete cascade,
  selos_atual int not null default 0,
  status text not null default 'em_andamento' check (status in ('em_andamento', 'completo', 'resgatado')),
  completado_em timestamptz,
  resgatado_em timestamptz,
  created_at timestamptz not null default now()
);
-- So um cartao "aberto" por cliente+programa. Quando resgatado, o ciclo fecha; um novo cartao
-- nasce do zero na proxima vez que o servico for concluido (a RPC cria, nao ha upsert aqui).
create unique index cartoes_fidelidade_aberto_unico on cartoes_fidelidade (cliente_id, programa_id)
  where status in ('em_andamento', 'completo');
create index idx_cartoes_fidelidade_estabelecimento on cartoes_fidelidade (estabelecimento_id);

create table fidelidade_selos (
  id uuid primary key default gen_random_uuid(),
  cartao_id uuid not null references cartoes_fidelidade(id) on delete cascade,
  agendamento_id uuid not null references agendamentos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (agendamento_id)
);
-- unique(agendamento_id) e a defesa central contra fraude/duplicidade: nunca mais de um selo por
-- visita, e da pra reverter um selo especifico se o status do agendamento for corrigido depois.
create index idx_fidelidade_selos_cartao on fidelidade_selos (cartao_id);

-- ============================================================
-- RLS -- so membros do proprio estabelecimento. Sem policy anonima: nao ha fluxo publico
-- nesta leva (concessao e resgate acontecem so pelo painel autenticado).
-- ============================================================

alter table programas_fidelidade enable row level security;
alter table cartoes_fidelidade enable row level security;
alter table fidelidade_selos enable row level security;

create policy "membros leem programas_fidelidade" on programas_fidelidade for select
  using (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin());

create policy "membros escrevem programas_fidelidade" on programas_fidelidade for all
  using (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin())
  with check (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin());

create policy "membros leem cartoes_fidelidade" on cartoes_fidelidade for select
  using (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin());

-- Escrita em cartoes_fidelidade so acontece via RPC security definer (concessao/revogacao de
-- selo e resgate) -- nao ha necessidade de policy de escrita direta para membros.

create policy "membros leem fidelidade_selos" on fidelidade_selos for select
  using (
    exists (
      select 1 from cartoes_fidelidade c
      where c.id = fidelidade_selos.cartao_id
        and (c.estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin())
    )
  );
