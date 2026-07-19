-- Tema premium vendido avulso (nao amarrado ao plano da plataforma). Reaproveita o mesmo
-- padrao ja usado em `pagamentos` (pedido_id como mais uma FK opcional ao lado de
-- agendamento_id/assinatura_cliente_id): pagamentos_plataforma ganha tema_plataforma_id como
-- alternativa a plano_plataforma_id, em vez de criar uma tabela de cobranca paralela.

create table temas_plataforma (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,           -- usado em data-tema, ex: 'prestigio'
  nome text not null,
  descricao text,
  preco_centavos int not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table temas_plataforma enable row level security;

create policy "qualquer um le temas ativos" on temas_plataforma for select
  using (ativo or eh_super_admin());

create policy "super_admin escreve temas" on temas_plataforma for insert
  with check (eh_super_admin());

create policy "super_admin atualiza temas" on temas_plataforma for update
  using (eh_super_admin())
  with check (eh_super_admin());

create policy "super_admin remove temas" on temas_plataforma for delete
  using (eh_super_admin());

insert into temas_plataforma (chave, nome, descricao, preco_centavos)
values (
  'prestigio',
  'Prestígio',
  'Verde profundo e dourado — sofisticação atemporal que combina tanto com barbearias clássicas quanto com salões de beleza boutique.',
  14900
);

-- pagamentos_plataforma passa a cobrir dois tipos de cobranca (assinatura de plano OU compra
-- avulsa de tema): exatamente um dos dois deve estar preenchido por linha.
alter table pagamentos_plataforma alter column plano_plataforma_id drop not null;
alter table pagamentos_plataforma add column tema_plataforma_id uuid references temas_plataforma(id);
alter table pagamentos_plataforma add constraint pagamentos_plataforma_um_tipo
  check ((plano_plataforma_id is not null) <> (tema_plataforma_id is not null));

create table estabelecimento_temas_comprados (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  tema_plataforma_id uuid not null references temas_plataforma(id),
  pagamento_plataforma_id uuid references pagamentos_plataforma(id),
  comprado_em timestamptz not null default now(),
  unique (estabelecimento_id, tema_plataforma_id)
);

create index idx_estabelecimento_temas_comprados_estabelecimento
  on estabelecimento_temas_comprados (estabelecimento_id);

alter table estabelecimento_temas_comprados enable row level security;

create policy "owner le temas comprados" on estabelecimento_temas_comprados for select
  using (
    estabelecimento_id in (
      select estabelecimento_id from membros_estabelecimento
      where usuario_id = auth.uid() and papel = 'owner'
    ) or eh_super_admin()
  );
