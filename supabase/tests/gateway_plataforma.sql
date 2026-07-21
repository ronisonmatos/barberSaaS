-- Teste do seletor de gateway em configuracao_plataforma (migration 20260720160001_asaas_plataforma.sql).
-- Roda inteiro dentro de uma transacao que sempre da ROLLBACK.
-- Uso: supabase db query --linked -f supabase/tests/gateway_plataforma.sql

begin;

-- Sempre existe uma unica linha singleton -- guarda o estado atual pra restaurar depois do rollback
-- (a transacao ja garante isso, mas facilita comparar antes/depois dentro do proprio script).
do $$
declare
  v_original configuracao_plataforma;
begin
  select * into v_original from configuracao_plataforma where id = '00000000-0000-0000-0000-000000000001';

  -- Cenario 1: mercado_pago ativo com token -> configurado
  update configuracao_plataforma
    set gateway_ativo = 'mercado_pago', mercado_pago_access_token = 'TEST-token', asaas_api_key = null
    where id = '00000000-0000-0000-0000-000000000001';
  if not pagamento_plataforma_configurado() then
    raise exception 'deveria estar configurado com mercado_pago + token';
  end if;
  if gateway_plataforma_ativo() <> 'mercado_pago' then
    raise exception 'gateway_plataforma_ativo deveria retornar mercado_pago';
  end if;

  -- Cenario 2: mercado_pago ativo mas sem token -> nao configurado
  update configuracao_plataforma
    set mercado_pago_access_token = null
    where id = '00000000-0000-0000-0000-000000000001';
  if pagamento_plataforma_configurado() then
    raise exception 'nao deveria estar configurado com mercado_pago sem token';
  end if;

  -- Cenario 3: asaas ativo com chave -> configurado, mesmo com token de mercado_pago ausente
  update configuracao_plataforma
    set gateway_ativo = 'asaas', asaas_api_key = 'TEST-asaas-key'
    where id = '00000000-0000-0000-0000-000000000001';
  if not pagamento_plataforma_configurado() then
    raise exception 'deveria estar configurado com asaas + chave';
  end if;
  if gateway_plataforma_ativo() <> 'asaas' then
    raise exception 'gateway_plataforma_ativo deveria retornar asaas';
  end if;

  -- Cenario 4: asaas ativo mas sem chave -> nao configurado
  update configuracao_plataforma
    set asaas_api_key = null
    where id = '00000000-0000-0000-0000-000000000001';
  if pagamento_plataforma_configurado() then
    raise exception 'nao deveria estar configurado com asaas sem chave';
  end if;

  -- Restaura o estado original (a transacao vai dar rollback de qualquer forma, so por clareza)
  update configuracao_plataforma set
    gateway_ativo = v_original.gateway_ativo,
    mercado_pago_access_token = v_original.mercado_pago_access_token,
    asaas_api_key = v_original.asaas_api_key
  where id = '00000000-0000-0000-0000-000000000001';

  raise notice 'gateway_plataforma: OK';
end $$;

rollback;
