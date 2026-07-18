-- Devolve estoque quando um pedido e cancelado (pagamento falhou/expirou) -- usado pelo webhook
-- do Mercado Pago e pelo cron de expiracao de pendentes (web/lib/estoque.ts).
create or replace function incrementar_estoque_produto(p_produto_id uuid, p_quantidade int) returns void
language sql security definer set search_path = public as $$
  update produtos set estoque = estoque + p_quantidade where id = p_produto_id;
$$;
