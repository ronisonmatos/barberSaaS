-- Leitura publica do cartao fidelidade: leva 1 deixou programas_fidelidade/cartoes_fidelidade
-- sem nenhuma policy anonima de proposito ("nao ha fluxo publico nesta leva"). Agora o cliente
-- final passa a ver o proprio progresso em dois lugares: popup no check-in (por telefone) e
-- secao persistente em /meus-agendamentos/{token} (por token_acesso). Nenhuma das duas RPCs
-- aceita cliente_id/cartao_id cru do client -- resolvem a identidade internamente, mesmo padrao
-- de checkin_buscar_agendamentos_publico/agendamento_por_token.

create or replace function fidelidade_status_cliente(p_cliente_id uuid) returns table (
  cartao_id uuid,
  programa_nome text,
  brinde text,
  selos_atual int,
  selos_necessarios int,
  status text
) language sql stable security definer set search_path = public as $$
  select
    c.id,
    p.nome,
    case when p.brinde_tipo = 'servico' then s.nome else pr.nome end,
    c.selos_atual,
    p.selos_necessarios,
    c.status
  from cartoes_fidelidade c
  join programas_fidelidade p on p.id = c.programa_id
  left join servicos s on s.id = p.brinde_servico_id
  left join produtos pr on pr.id = p.brinde_produto_id
  where c.cliente_id = p_cliente_id
    and c.status in ('em_andamento', 'completo')
  order by c.status desc, c.created_at desc;
$$;

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
    select 1 from estabelecimentos
    where id = p_estabelecimento_id and status in ('ativa', 'trial')
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

grant execute on function cartoes_fidelidade_publico_por_telefone(uuid, text) to anon, authenticated;

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

grant execute on function cartao_fidelidade_por_token(uuid) to anon, authenticated;
