-- RPC publica: expoe so o que a pagina de agendamento precisa saber (quais formas de
-- pagamento estao ativas + public key do Mercado Pago, que e feita pra rodar no client).
-- Nunca expoe access_token/api_key/webhook_secret.

create or replace function formas_pagamento_publico(p_estabelecimento_id uuid)
returns table (
  aceita_pagamento_antecipado boolean,
  aceita_pagamento_no_dia boolean,
  gateway_ativo text,
  mercado_pago_public_key text
)
language sql stable security definer set search_path = public as $$
  select aceita_pagamento_antecipado, aceita_pagamento_no_dia, gateway_ativo, mercado_pago_public_key
  from estabelecimento_pagamento_config
  where estabelecimento_id = p_estabelecimento_id;
$$;

grant execute on function formas_pagamento_publico(uuid) to anon, authenticated;
