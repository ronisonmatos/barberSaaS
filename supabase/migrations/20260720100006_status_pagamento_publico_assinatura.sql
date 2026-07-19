-- status_pagamento_publico ganha status_assinatura (polling da tela de "assinando o plano",
-- mesmo padrao ja usado pra agendamento/pedido). Muda a lista de colunas de retorno -- precisa
-- dropar e recriar (create or replace nao permite mudar o retorno), mesmo motivo documentado em
-- 20260716140001_metodo_cartao.sql e repetido em 20260717150003_rpc_pedidos.sql.

drop function if exists status_pagamento_publico(uuid, uuid);

create function status_pagamento_publico(p_pagamento_id uuid, p_token uuid)
returns table (
  status_pagamento status_pagamento,
  status_agendamento status_agendamento,
  status_pedido status_pedido,
  status_assinatura status_assinatura
)
language sql stable security definer set search_path = public as $$
  select p.status, a.status, pd.status, ac.status
  from pagamentos p
  join clientes c on c.id = p.cliente_id
  left join agendamentos a on a.id = p.agendamento_id
  left join pedidos pd on pd.id = p.pedido_id
  left join assinaturas_clientes ac on ac.id = p.assinatura_cliente_id
  where p.id = p_pagamento_id and c.token_acesso = p_token;
$$;

grant execute on function status_pagamento_publico(uuid, uuid) to anon, authenticated;
