-- Adiciona seletor de gateway pra cobranca da PLATAFORMA (Comptus cobrando o estabelecimento),
-- espelhando o gateway_ativo que ja existe em estabelecimento_pagamento_config. Ate aqui
-- configuracao_plataforma so tinha credenciais lado a lado sem seletor -- Mercado Pago era
-- hardcoded em todo canto (pagamento_plataforma_configurado(), webhook, server actions de
-- plano/tema). Default 'mercado_pago' preserva o comportamento da linha singleton ja existente.

alter table configuracao_plataforma
  add column gateway_ativo text not null default 'mercado_pago' check (gateway_ativo in ('mercado_pago', 'asaas')),
  add column asaas_webhook_token text;

create or replace function pagamento_plataforma_configurado() returns boolean
language sql stable security definer set search_path = public as $$
  select
    (gateway_ativo = 'mercado_pago' and mercado_pago_access_token is not null)
    or (gateway_ativo = 'asaas' and asaas_api_key is not null)
  from configuracao_plataforma where id = '00000000-0000-0000-0000-000000000001';
$$;

-- Expoe qual gateway esta ativo pro dono decidir qual checkout renderizar -- mesmo padrao seguro
-- de mercado_pago_platform_public_key() (nao expoe nenhuma credencial, so o nome do gateway).
create or replace function gateway_plataforma_ativo() returns text
language sql stable security definer set search_path = public as $$
  select gateway_ativo from configuracao_plataforma where id = '00000000-0000-0000-0000-000000000001';
$$;

grant execute on function gateway_plataforma_ativo() to authenticated;
