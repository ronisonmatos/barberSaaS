-- Configuracao de gateway de pagamento da PLATAFORMA (cobranca da assinatura Comptus dos
-- estabelecimentos e dos temas premium avulsos) -- ate agora era só MERCADO_PAGO_PLATFORM_*
-- direto em variavel de ambiente, sem nenhuma tela. Singleton (id fixo, mesma convencao ja usada
-- pelos planos seed Essencial/Pro com uuid sequencial) editavel só por super_admin.
-- Mesmo desenho de estabelecimento_pagamento_config (gateway_ativo + credenciais nullable),
-- ja incluindo asaas_api_key para quando a cobranca via Asaas da plataforma for implementada
-- (hoje so estabelecimento_pagamento_config guarda a chave, sem logica de cobranca de verdade).

create table configuracao_plataforma (
  id uuid primary key default '00000000-0000-0000-0000-000000000001',
  mercado_pago_access_token text,
  mercado_pago_public_key text,
  mercado_pago_webhook_secret text,
  asaas_api_key text,
  updated_at timestamptz not null default now()
);

alter table configuracao_plataforma enable row level security;

create policy "super_admin le configuracao_plataforma" on configuracao_plataforma for select
  using (eh_super_admin());

create policy "super_admin escreve configuracao_plataforma" on configuracao_plataforma for all
  using (eh_super_admin())
  with check (eh_super_admin());

insert into configuracao_plataforma (id) values ('00000000-0000-0000-0000-000000000001');

-- Expoe só o que é seguro mostrar pro dono de estabelecimento comum (nao super_admin) decidir se
-- mostra o checkout Pix/cartao da assinatura -- mesmo padrao de formas_pagamento_publico.
create or replace function mercado_pago_platform_public_key() returns text
language sql stable security definer set search_path = public as $$
  select mercado_pago_public_key from configuracao_plataforma where id = '00000000-0000-0000-0000-000000000001';
$$;

create or replace function pagamento_plataforma_configurado() returns boolean
language sql stable security definer set search_path = public as $$
  select mercado_pago_access_token is not null from configuracao_plataforma where id = '00000000-0000-0000-0000-000000000001';
$$;

grant execute on function mercado_pago_platform_public_key() to authenticated;
grant execute on function pagamento_plataforma_configurado() to authenticated;
