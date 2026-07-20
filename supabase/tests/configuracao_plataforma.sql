-- Testes da configuracao de pagamento da plataforma (configuracao_plataforma).
-- Nota: a conexao usada por `supabase db query` bypassa RLS (mesmo comportamento observado nos
-- outros testes deste projeto), entao aqui validamos o que de fato e testavel por essa via: o
-- comportamento das RPCs security definer (que sao a superficie realmente exposta a authenticated
-- via grant, independente de RLS na tabela). A policy de RLS em si (eh_super_admin() na tabela)
-- segue o mesmo padrao ja usado e validado em estabelecimento_pagamento_config.
-- Roda inteiro dentro de uma transacao que sempre da ROLLBACK.
-- Uso: supabase db query --linked -f supabase/tests/configuracao_plataforma.sql

begin;

update configuracao_plataforma
set mercado_pago_public_key = 'TEST-public-key-inicial', mercado_pago_access_token = 'TEST-access-token-inicial'
where id = '00000000-0000-0000-0000-000000000001';

-- ============================================================
-- Cenario 1: RPCs publicas retornam os valores esperados.
do $$
declare
  v_public_key text;
  v_configurado boolean;
begin
  select mercado_pago_platform_public_key() into v_public_key;
  select pagamento_plataforma_configurado() into v_configurado;
  if v_public_key is distinct from 'TEST-public-key-inicial' then
    raise exception 'RPC deveria retornar a public key salva, veio %', v_public_key;
  end if;
  if v_configurado is not true then
    raise exception 'RPC deveria indicar pagamento configurado (access_token setado)';
  end if;
  raise notice 'cenario 1 (RPCs refletem os valores salvos): OK';
end $$;

-- ============================================================
-- Cenario 2: RPC pagamento_plataforma_configurado() reflete access_token null como false.
update configuracao_plataforma set mercado_pago_access_token = null where id = '00000000-0000-0000-0000-000000000001';

do $$
declare
  v_configurado boolean;
begin
  select pagamento_plataforma_configurado() into v_configurado;
  if v_configurado is not false then
    raise exception 'RPC deveria retornar false quando access_token e null';
  end if;
  raise notice 'cenario 2 (RPC reflete access_token null como nao configurado): OK';
end $$;

-- ============================================================
-- Cenario 3: RPC mercado_pago_platform_public_key() reflete public_key null.
update configuracao_plataforma set mercado_pago_public_key = null where id = '00000000-0000-0000-0000-000000000001';

do $$
declare
  v_public_key text;
begin
  select mercado_pago_platform_public_key() into v_public_key;
  if v_public_key is not null then
    raise exception 'RPC deveria retornar null quando public_key e null, veio %', v_public_key;
  end if;
  raise notice 'cenario 3 (RPC reflete public_key null): OK';
end $$;

-- ============================================================
-- Cenario 4: continua existindo exatamente 1 linha (singleton) mesmo apos os updates acima.
do $$
declare
  v_count int;
begin
  select count(*) into v_count from configuracao_plataforma;
  if v_count <> 1 then
    raise exception 'deveria continuar existindo exatamente 1 linha (singleton), veio %', v_count;
  end if;
  raise notice 'cenario 4 (singleton continua com 1 linha): OK';
end $$;

rollback;
