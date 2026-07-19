-- Resgate do brinde: acao manual do painel, aberta a qualquer membro (staff inclusive) -- e
-- operacional, o funcionario entrega o brinde na hora e ja tem o cliente na sua frente, entao o
-- risco de fraude aqui e baixo (diferente de reembolso, que mexe em dinheiro de verdade e por
-- isso e ownerOnly). So permite resgatar cartao 'completo'; marca 'resgatado' de forma que nunca
-- pode ser resgatado duas vezes (proxima chamada cai no "cartao ainda nao esta completo").

create or replace function resgatar_cartao_fidelidade(p_cartao_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_cartao cartoes_fidelidade;
begin
  select * into v_cartao from cartoes_fidelidade
    where id = p_cartao_id and estabelecimento_id in (select meus_estabelecimentos())
    for update;
  if not found then
    raise exception 'cartao nao encontrado ou sem permissao';
  end if;
  if v_cartao.status <> 'completo' then
    raise exception 'cartao ainda nao esta completo';
  end if;

  update cartoes_fidelidade set status = 'resgatado', resgatado_em = now()
    where id = p_cartao_id;
end;
$$;

grant execute on function resgatar_cartao_fidelidade(uuid) to authenticated;
