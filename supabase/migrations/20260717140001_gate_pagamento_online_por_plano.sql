-- Pagamento online (cobranca no agendamento via Mercado Pago/Asaas) vira recurso de plano: Free
-- nao tem, Essencial/Pro tem. Durante o trial (plano_plataforma_id null) o recurso continua
-- liberado -- so o plano Free de verdade restringe.
update planos_plataforma set recursos = recursos || '{"pagamento_online": false}'::jsonb
where nome = 'Free';
update planos_plataforma set recursos = recursos || '{"pagamento_online": true}'::jsonb
where nome in ('Essencial', 'Pro');

create or replace function estabelecimento_permite_pagamento_online(p_estabelecimento_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when e.plano_plataforma_id is null then true
    else coalesce((pp.recursos->>'pagamento_online')::boolean, false)
  end
  from estabelecimentos e
  left join planos_plataforma pp on pp.id = e.plano_plataforma_id
  where e.id = p_estabelecimento_id;
$$;

-- A pagina publica de agendamento decide se mostra a opcao de pagar online so olhando pra
-- aceita_pagamento_antecipado (ver agendar-wizard.tsx) -- entao zerar aqui basta pra esconder do
-- cliente, sem mexer na config salva pelo dono (ele nao perde a configuracao, so fica bloqueada
-- enquanto o plano nao permitir).
create or replace function formas_pagamento_publico(p_estabelecimento_id uuid)
returns table (
  aceita_pagamento_antecipado boolean,
  aceita_pagamento_no_dia boolean,
  gateway_ativo text,
  mercado_pago_public_key text
)
language sql stable security definer set search_path = public as $$
  select
    aceita_pagamento_antecipado and estabelecimento_permite_pagamento_online(p_estabelecimento_id),
    aceita_pagamento_no_dia,
    gateway_ativo,
    mercado_pago_public_key
  from estabelecimento_pagamento_config
  where estabelecimento_id = p_estabelecimento_id;
$$;
