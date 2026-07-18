-- Sistema de loja: estabelecimento cadastra produtos, cliente compra avulso ou junto com um
-- servico agendado (so retirada no local por enquanto). Ver plano da leva "Loja de produtos".

create type status_pedido as enum ('pendente', 'aguardando_retirada', 'retirado', 'cancelado');

create table produtos (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  nome text not null,
  descricao text,
  preco_centavos int not null check (preco_centavos >= 0),
  estoque int not null default 0 check (estoque >= 0),
  foto_url text,
  ativo boolean not null default true,
  desativado_por_limite_plano boolean not null default false,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);
create index idx_produtos_estabelecimento on produtos (estabelecimento_id, ordem);

create table pedidos (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  cliente_id uuid not null references clientes(id),
  agendamento_id uuid references agendamentos(id),
  status status_pedido not null default 'pendente',
  total_centavos int not null,
  created_at timestamptz not null default now()
);
create index idx_pedidos_estabelecimento on pedidos (estabelecimento_id, created_at);

create table pedido_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  produto_id uuid not null references produtos(id),
  nome_produto text not null,
  quantidade int not null check (quantidade > 0),
  preco_unitario_centavos int not null,
  created_at timestamptz not null default now()
);
create index idx_pedido_itens_pedido on pedido_itens (pedido_id);

alter table pagamentos add column pedido_id uuid references pedidos(id);

-- ============================================================
-- RLS
-- ============================================================

alter table produtos enable row level security;
alter table pedidos enable row level security;
alter table pedido_itens enable row level security;

create policy "membros leem produtos" on produtos for select
  using (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin());

create policy "membros escrevem produtos" on produtos for all
  using (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin())
  with check (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin());

-- publico ve produtos: exige tambem estabelecimento_permite_loja(), criada na migration seguinte
-- (junto com o gate por plano) -- essa policy e recriada la.

-- pedidos/pedido_itens: nunca tem leitura anonima direta (mesmo padrao de agendamentos/pagamentos),
-- todo acesso publico passa por RPC security definer.
create policy "membros leem pedidos" on pedidos for select
  using (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin());

create policy "membros escrevem pedidos" on pedidos for all
  using (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin())
  with check (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin());

create policy "membros leem itens de pedido" on pedido_itens for select
  using (
    exists (
      select 1 from pedidos p
      where p.id = pedido_itens.pedido_id
        and (p.estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin())
    )
  );

create policy "membros escrevem itens de pedido" on pedido_itens for all
  using (
    exists (
      select 1 from pedidos p
      where p.id = pedido_itens.pedido_id
        and (p.estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin())
    )
  )
  with check (
    exists (
      select 1 from pedidos p
      where p.id = pedido_itens.pedido_id
        and (p.estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin())
    )
  );
