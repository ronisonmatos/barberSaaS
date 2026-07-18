-- RPCs de compra de produtos: avulsa (sem agendamento) e combinada (junto com um servico
-- agendado, um pagamento so). Ver secao 3 do plano da leva "Loja de produtos".

-- Helper reutilizado pelas 4 RPCs de compra: decrementa estoque atomicamente (UPDATE ... WHERE
-- estoque >= quantidade ja serializa concorrencia, sem precisar de lock explicito) e grava os
-- itens congelados. Roda dentro da transacao da RPC chamadora -- qualquer excecao (estoque
-- insuficiente) desfaz tudo, inclusive itens ja processados antes dela no mesmo loop.
create or replace function processar_itens_pedido(p_estabelecimento_id uuid, p_pedido_id uuid, p_itens jsonb)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb;
  v_produto_id uuid;
  v_quantidade int;
  v_produto produtos;
  v_total int := 0;
begin
  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    v_produto_id := (v_item->>'produto_id')::uuid;
    v_quantidade := (v_item->>'quantidade')::int;
    if v_quantidade is null or v_quantidade <= 0 then
      raise exception 'quantidade invalida';
    end if;

    update produtos
      set estoque = estoque - v_quantidade
      where id = v_produto_id
        and estabelecimento_id = p_estabelecimento_id
        and ativo
        and estoque >= v_quantidade
      returning * into v_produto;

    if not found then
      raise exception 'produto indisponivel ou sem estoque suficiente';
    end if;

    insert into pedido_itens (pedido_id, produto_id, nome_produto, quantidade, preco_unitario_centavos)
    values (p_pedido_id, v_produto_id, v_produto.nome, v_quantidade, v_produto.preco_centavos);

    v_total := v_total + v_produto.preco_centavos * v_quantidade;
  end loop;

  if v_total = 0 then
    raise exception 'carrinho vazio';
  end if;

  return v_total;
end;
$$;

-- ============================================================
-- Compra avulsa, sem cobranca online ("retirar e pagar no local")
-- ============================================================
create or replace function criar_pedido_publico(
  p_estabelecimento_id uuid,
  p_itens jsonb,
  p_nome text,
  p_telefone text,
  p_email text default null
) returns table (pedido_id uuid, token_acesso uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_estabelecimento estabelecimentos;
  v_cliente_id uuid;
  v_token uuid;
  v_pedido_id uuid;
  v_total int;
begin
  if p_nome is null or length(trim(p_nome)) = 0 then
    raise exception 'nome obrigatorio';
  end if;
  if p_telefone !~ '^\+[1-9]\d{7,14}$' then
    raise exception 'telefone invalido, use formato E.164';
  end if;

  select * into v_estabelecimento from estabelecimentos where id = p_estabelecimento_id and status in ('ativa', 'trial');
  if not found then
    raise exception 'estabelecimento indisponivel';
  end if;

  if not estabelecimento_permite_loja(p_estabelecimento_id) then
    raise exception 'loja indisponivel para este estabelecimento';
  end if;

  insert into clientes (estabelecimento_id, nome, telefone, email)
  values (p_estabelecimento_id, trim(p_nome), p_telefone, p_email)
  on conflict (estabelecimento_id, telefone) do update
    set nome = excluded.nome,
        email = coalesce(excluded.email, clientes.email)
  returning clientes.id, clientes.token_acesso into v_cliente_id, v_token;

  insert into pedidos (estabelecimento_id, cliente_id, status, total_centavos)
  values (p_estabelecimento_id, v_cliente_id, 'aguardando_retirada', 0)
  returning pedidos.id into v_pedido_id;

  v_total := processar_itens_pedido(p_estabelecimento_id, v_pedido_id, p_itens);
  update pedidos set total_centavos = v_total where id = v_pedido_id;

  return query select v_pedido_id, v_token;
end;
$$;

grant execute on function criar_pedido_publico(uuid, jsonb, text, text, text) to anon, authenticated;

-- ============================================================
-- Compra avulsa, com cobranca online (pix/cartao)
-- ============================================================
create or replace function criar_pedido_publico_pix(
  p_estabelecimento_id uuid,
  p_itens jsonb,
  p_nome text,
  p_telefone text,
  p_email text,
  p_metodo metodo_pagamento default 'pix'
) returns table (pedido_id uuid, pagamento_id uuid, token_acesso uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_estabelecimento estabelecimentos;
  v_config estabelecimento_pagamento_config;
  v_cliente_id uuid;
  v_token uuid;
  v_pedido_id uuid;
  v_pagamento_id uuid;
  v_total int;
begin
  if p_metodo not in ('pix', 'cartao') then
    raise exception 'metodo de pagamento invalido';
  end if;
  if p_nome is null or length(trim(p_nome)) = 0 then
    raise exception 'nome obrigatorio';
  end if;
  if p_telefone !~ '^\+[1-9]\d{7,14}$' then
    raise exception 'telefone invalido, use formato E.164';
  end if;
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'e-mail invalido';
  end if;

  select * into v_estabelecimento from estabelecimentos where id = p_estabelecimento_id and status in ('ativa', 'trial');
  if not found then
    raise exception 'estabelecimento indisponivel';
  end if;

  if not estabelecimento_permite_loja(p_estabelecimento_id) then
    raise exception 'loja indisponivel para este estabelecimento';
  end if;

  select * into v_config from estabelecimento_pagamento_config where estabelecimento_id = p_estabelecimento_id;
  if not found or not v_config.aceita_pagamento_antecipado or v_config.gateway_ativo <> 'mercado_pago' then
    raise exception 'pagamento antecipado indisponivel para este estabelecimento';
  end if;

  insert into clientes (estabelecimento_id, nome, telefone, email)
  values (p_estabelecimento_id, trim(p_nome), p_telefone, p_email)
  on conflict (estabelecimento_id, telefone) do update
    set nome = excluded.nome,
        email = coalesce(excluded.email, clientes.email)
  returning clientes.id, clientes.token_acesso into v_cliente_id, v_token;

  insert into pedidos (estabelecimento_id, cliente_id, status, total_centavos)
  values (p_estabelecimento_id, v_cliente_id, 'pendente', 0)
  returning pedidos.id into v_pedido_id;

  v_total := processar_itens_pedido(p_estabelecimento_id, v_pedido_id, p_itens);
  update pedidos set total_centavos = v_total where id = v_pedido_id;

  insert into pagamentos (estabelecimento_id, pedido_id, cliente_id, valor_centavos, metodo, status)
  values (p_estabelecimento_id, v_pedido_id, v_cliente_id, v_total, p_metodo, 'pendente')
  returning pagamentos.id into v_pagamento_id;

  return query select v_pedido_id, v_pagamento_id, v_token;
end;
$$;

grant execute on function criar_pedido_publico_pix(uuid, jsonb, text, text, text, metodo_pagamento) to anon, authenticated;

-- ============================================================
-- Compra combinada: estende as RPCs de agendamento com um carrinho opcional de produtos.
-- Mudar a assinatura cria sobrecarga em vez de substituir (mesmo motivo documentado em
-- 20260716140001_metodo_cartao.sql) -- precisa dropar explicitamente as versoes antigas.
-- ============================================================
drop function if exists criar_agendamento_publico(uuid, uuid, uuid, timestamptz, text, text, text);

create function criar_agendamento_publico(
  p_estabelecimento_id uuid,
  p_profissional_id uuid,
  p_servico_id uuid,
  p_inicio timestamptz,
  p_nome text,
  p_telefone text,
  p_email text default null,
  p_itens jsonb default null
) returns table (agendamento_id uuid, token_acesso uuid, pedido_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_servico servicos;
  v_estabelecimento estabelecimentos;
  v_fim timestamptz;
  v_data_local date;
  v_cliente_id uuid;
  v_token uuid;
  v_agendamento_id uuid;
  v_pedido_id uuid;
  v_total int;
begin
  if p_nome is null or length(trim(p_nome)) = 0 then
    raise exception 'nome obrigatorio';
  end if;
  if p_telefone !~ '^\+[1-9]\d{7,14}$' then
    raise exception 'telefone invalido, use formato E.164';
  end if;

  select * into v_estabelecimento from estabelecimentos where id = p_estabelecimento_id and status in ('ativa', 'trial');
  if not found then
    raise exception 'estabelecimento indisponivel';
  end if;

  select * into v_servico
  from servicos
  where id = p_servico_id and estabelecimento_id = p_estabelecimento_id and ativo
    and exists (
      select 1 from profissional_servicos ps
      where ps.servico_id = servicos.id and ps.profissional_id = p_profissional_id
    );
  if not found then
    raise exception 'servico indisponivel para este profissional';
  end if;

  if p_itens is not null and jsonb_array_length(p_itens) > 0 and not estabelecimento_permite_loja(p_estabelecimento_id) then
    raise exception 'loja indisponivel para este estabelecimento';
  end if;

  v_fim := p_inicio + (v_servico.duracao_minutos || ' minutes')::interval;
  v_data_local := (p_inicio at time zone v_estabelecimento.timezone)::date;

  if not exists (
    select 1 from slots_disponiveis(p_estabelecimento_id, p_profissional_id, p_servico_id, v_data_local)
    where inicio = p_inicio
  ) then
    raise exception 'horario indisponivel';
  end if;

  insert into clientes (estabelecimento_id, nome, telefone, email)
  values (p_estabelecimento_id, trim(p_nome), p_telefone, p_email)
  on conflict (estabelecimento_id, telefone) do update
    set nome = excluded.nome,
        email = coalesce(excluded.email, clientes.email)
  returning clientes.id, clientes.token_acesso into v_cliente_id, v_token;

  begin
    insert into agendamentos (
      estabelecimento_id, cliente_id, profissional_id, servico_id,
      inicio, fim, status, origem, preco_centavos
    )
    values (
      p_estabelecimento_id, v_cliente_id, p_profissional_id, p_servico_id,
      p_inicio, v_fim, 'confirmado', 'online', v_servico.preco_centavos
    )
    returning agendamentos.id into v_agendamento_id;
  exception when exclusion_violation then
    raise exception 'horario acabou de ser reservado por outra pessoa, escolha outro horario';
  end;

  if p_itens is not null and jsonb_array_length(p_itens) > 0 then
    insert into pedidos (estabelecimento_id, cliente_id, agendamento_id, status, total_centavos)
    values (p_estabelecimento_id, v_cliente_id, v_agendamento_id, 'aguardando_retirada', 0)
    returning pedidos.id into v_pedido_id;

    v_total := processar_itens_pedido(p_estabelecimento_id, v_pedido_id, p_itens);
    update pedidos set total_centavos = v_total where id = v_pedido_id;
  end if;

  return query select v_agendamento_id, v_token, v_pedido_id;
end;
$$;

grant execute on function criar_agendamento_publico(uuid, uuid, uuid, timestamptz, text, text, text, jsonb) to anon, authenticated;

drop function if exists criar_agendamento_publico_pix(uuid, uuid, uuid, timestamptz, text, text, text, metodo_pagamento);

create function criar_agendamento_publico_pix(
  p_estabelecimento_id uuid,
  p_profissional_id uuid,
  p_servico_id uuid,
  p_inicio timestamptz,
  p_nome text,
  p_telefone text,
  p_email text,
  p_metodo metodo_pagamento default 'pix',
  p_itens jsonb default null
) returns table (agendamento_id uuid, pagamento_id uuid, token_acesso uuid, pedido_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_servico servicos;
  v_estabelecimento estabelecimentos;
  v_config estabelecimento_pagamento_config;
  v_fim timestamptz;
  v_data_local date;
  v_cliente_id uuid;
  v_token uuid;
  v_agendamento_id uuid;
  v_pagamento_id uuid;
  v_pedido_id uuid;
  v_total_produtos int := 0;
  v_total_pagamento int;
begin
  if p_metodo not in ('pix', 'cartao') then
    raise exception 'metodo de pagamento invalido';
  end if;

  if p_nome is null or length(trim(p_nome)) = 0 then
    raise exception 'nome obrigatorio';
  end if;
  if p_telefone !~ '^\+[1-9]\d{7,14}$' then
    raise exception 'telefone invalido, use formato E.164';
  end if;
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'e-mail invalido';
  end if;

  select * into v_estabelecimento from estabelecimentos where id = p_estabelecimento_id and status in ('ativa', 'trial');
  if not found then
    raise exception 'estabelecimento indisponivel';
  end if;

  if not estabelecimento_permite_pagamento_online(p_estabelecimento_id) then
    raise exception 'pagamento antecipado indisponivel para este estabelecimento';
  end if;

  if p_itens is not null and jsonb_array_length(p_itens) > 0 and not estabelecimento_permite_loja(p_estabelecimento_id) then
    raise exception 'loja indisponivel para este estabelecimento';
  end if;

  select * into v_config from estabelecimento_pagamento_config where estabelecimento_id = p_estabelecimento_id;
  if not found or not v_config.aceita_pagamento_antecipado or v_config.gateway_ativo <> 'mercado_pago' then
    raise exception 'pagamento antecipado indisponivel para este estabelecimento';
  end if;

  select * into v_servico
  from servicos
  where id = p_servico_id and estabelecimento_id = p_estabelecimento_id and ativo
    and exists (
      select 1 from profissional_servicos ps
      where ps.servico_id = servicos.id and ps.profissional_id = p_profissional_id
    );
  if not found then
    raise exception 'servico indisponivel para este profissional';
  end if;

  v_fim := p_inicio + (v_servico.duracao_minutos || ' minutes')::interval;
  v_data_local := (p_inicio at time zone v_estabelecimento.timezone)::date;

  if not exists (
    select 1 from slots_disponiveis(p_estabelecimento_id, p_profissional_id, p_servico_id, v_data_local)
    where inicio = p_inicio
  ) then
    raise exception 'horario indisponivel';
  end if;

  insert into clientes (estabelecimento_id, nome, telefone, email)
  values (p_estabelecimento_id, trim(p_nome), p_telefone, p_email)
  on conflict (estabelecimento_id, telefone) do update
    set nome = excluded.nome,
        email = coalesce(excluded.email, clientes.email)
  returning clientes.id, clientes.token_acesso into v_cliente_id, v_token;

  begin
    insert into agendamentos (
      estabelecimento_id, cliente_id, profissional_id, servico_id,
      inicio, fim, status, origem, preco_centavos
    )
    values (
      p_estabelecimento_id, v_cliente_id, p_profissional_id, p_servico_id,
      p_inicio, v_fim, 'pendente', 'online', v_servico.preco_centavos
    )
    returning agendamentos.id into v_agendamento_id;
  exception when exclusion_violation then
    raise exception 'horario acabou de ser reservado por outra pessoa, escolha outro horario';
  end;

  if p_itens is not null and jsonb_array_length(p_itens) > 0 then
    insert into pedidos (estabelecimento_id, cliente_id, agendamento_id, status, total_centavos)
    values (p_estabelecimento_id, v_cliente_id, v_agendamento_id, 'pendente', 0)
    returning pedidos.id into v_pedido_id;

    v_total_produtos := processar_itens_pedido(p_estabelecimento_id, v_pedido_id, p_itens);
    update pedidos set total_centavos = v_total_produtos where id = v_pedido_id;
  end if;

  v_total_pagamento := v_servico.preco_centavos + v_total_produtos;

  insert into pagamentos (estabelecimento_id, agendamento_id, pedido_id, cliente_id, valor_centavos, metodo, status)
  values (p_estabelecimento_id, v_agendamento_id, v_pedido_id, v_cliente_id, v_total_pagamento, p_metodo, 'pendente')
  returning pagamentos.id into v_pagamento_id;

  return query select v_agendamento_id, v_pagamento_id, v_token, v_pedido_id;
end;
$$;

grant execute on function criar_agendamento_publico_pix(uuid, uuid, uuid, timestamptz, text, text, text, metodo_pagamento, jsonb) to anon, authenticated;

-- ============================================================
-- Generaliza status_pagamento_publico pra cobrir pagamento de pedido avulso (sem agendamento).
-- ============================================================
drop function if exists status_pagamento_publico(uuid, uuid);

create function status_pagamento_publico(p_pagamento_id uuid, p_token uuid)
returns table (status_pagamento status_pagamento, status_agendamento status_agendamento, status_pedido status_pedido)
language sql stable security definer set search_path = public as $$
  select p.status, a.status, pd.status
  from pagamentos p
  join clientes c on c.id = p.cliente_id
  left join agendamentos a on a.id = p.agendamento_id
  left join pedidos pd on pd.id = p.pedido_id
  where p.id = p_pagamento_id and c.token_acesso = p_token;
$$;

grant execute on function status_pagamento_publico(uuid, uuid) to anon, authenticated;

-- ============================================================
-- Pedidos do cliente via token, mesmo padrao de agendamento_por_token.
-- ============================================================
create or replace function pedido_por_token(p_token uuid)
returns table (
  pedido_id uuid,
  status status_pedido,
  total_centavos int,
  created_at timestamptz,
  agendamento_id uuid,
  itens jsonb
)
language sql stable security definer set search_path = public as $$
  select
    pd.id,
    pd.status,
    pd.total_centavos,
    pd.created_at,
    pd.agendamento_id,
    coalesce(
      (select jsonb_agg(jsonb_build_object(
          'nome_produto', pi.nome_produto,
          'quantidade', pi.quantidade,
          'preco_unitario_centavos', pi.preco_unitario_centavos
        ) order by pi.created_at)
       from pedido_itens pi where pi.pedido_id = pd.id),
      '[]'::jsonb
    )
  from clientes c
  join pedidos pd on pd.cliente_id = c.id
  where c.token_acesso = p_token
  order by pd.created_at desc;
$$;

grant execute on function pedido_por_token(uuid) to anon, authenticated;
