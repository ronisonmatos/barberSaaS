-- RPC publica para o cliente consultar o status do proprio pagamento Pix (polling na tela
-- de agendamento), validando posse via token_acesso -- mesmo padrao de agendamento_por_token.

create or replace function status_pagamento_publico(p_pagamento_id uuid, p_token uuid)
returns table (status_pagamento status_pagamento, status_agendamento status_agendamento)
language sql stable security definer set search_path = public as $$
  select p.status, a.status
  from pagamentos p
  join agendamentos a on a.id = p.agendamento_id
  join clientes c on c.id = p.cliente_id
  where p.id = p_pagamento_id and c.token_acesso = p_token;
$$;

grant execute on function status_pagamento_publico(uuid, uuid) to anon, authenticated;
