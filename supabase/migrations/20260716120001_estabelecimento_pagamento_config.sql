-- Configuracao de gateway de pagamento por estabelecimento (credenciais proprias, sem
-- subconta/split gerenciado pela plataforma). Acesso restrito a owner (nao staff) por ser
-- credencial sensivel.

create table estabelecimento_pagamento_config (
  estabelecimento_id uuid primary key references estabelecimentos(id) on delete cascade,
  gateway_ativo text not null default 'nenhum' check (gateway_ativo in ('nenhum', 'mercado_pago', 'asaas')),
  mercado_pago_access_token text,
  mercado_pago_public_key text,
  asaas_api_key text,
  updated_at timestamptz not null default now()
);

alter table estabelecimento_pagamento_config enable row level security;

create policy "owner le config de pagamento" on estabelecimento_pagamento_config for select
  using (
    estabelecimento_id in (
      select estabelecimento_id from membros_estabelecimento
      where usuario_id = auth.uid() and papel = 'owner'
    ) or eh_super_admin()
  );

create policy "owner escreve config de pagamento" on estabelecimento_pagamento_config for all
  using (
    estabelecimento_id in (
      select estabelecimento_id from membros_estabelecimento
      where usuario_id = auth.uid() and papel = 'owner'
    ) or eh_super_admin()
  )
  with check (
    estabelecimento_id in (
      select estabelecimento_id from membros_estabelecimento
      where usuario_id = auth.uid() and papel = 'owner'
    ) or eh_super_admin()
  );
