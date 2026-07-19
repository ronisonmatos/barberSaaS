-- Corrige ambiguidade: a coluna de saida "status" da funcao colide com estabelecimentos.status
-- dentro do corpo da funcao (erro 42702 detectado ao rodar supabase/tests/fidelidade_publico.sql).

create or replace function cartoes_fidelidade_publico_por_telefone(
  p_estabelecimento_id uuid,
  p_telefone text
) returns table (
  cartao_id uuid,
  programa_nome text,
  brinde text,
  selos_atual int,
  selos_necessarios int,
  status text
) language plpgsql stable security definer set search_path = public as $$
declare
  v_cliente_id uuid;
begin
  if not exists (
    select 1 from estabelecimentos e
    where e.id = p_estabelecimento_id and e.status in ('ativa', 'trial')
  ) then
    return;
  end if;

  if p_telefone !~ '^\+[1-9]\d{7,14}$' then
    return;
  end if;

  select id into v_cliente_id from clientes
    where estabelecimento_id = p_estabelecimento_id and telefone = p_telefone;
  if v_cliente_id is null then
    return;
  end if;

  return query select * from fidelidade_status_cliente(v_cliente_id);
end;
$$;

create or replace function cartao_fidelidade_por_token(p_token uuid) returns table (
  cartao_id uuid,
  programa_nome text,
  brinde text,
  selos_atual int,
  selos_necessarios int,
  status text
) language plpgsql stable security definer set search_path = public as $$
declare
  v_cliente_id uuid;
begin
  select cl.id into v_cliente_id
  from clientes cl
  join estabelecimentos e on e.id = cl.estabelecimento_id
  where cl.token_acesso = p_token and e.status in ('ativa', 'trial');
  if v_cliente_id is null then
    return;
  end if;

  return query select * from fidelidade_status_cliente(v_cliente_id);
end;
$$;
