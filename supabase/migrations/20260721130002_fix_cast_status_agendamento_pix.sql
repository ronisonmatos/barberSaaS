-- Segue direto da migration anterior (20260721130001): mesmo erro 42804 ja documentado em
-- 20260720100008_fix_cast_status_agendamento_assinatura.sql -- "case when ... then 'confirmado'
-- else 'pendente' end" nao tem como o Postgres inferir que e status_agendamento sem cast
-- explicito. Reaplicando aqui porque 20260721130001 reintroduziu o mesmo CASE sem o cast.
create or replace function criar_agendamento_publico_pix(
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
  v_assinatura_id uuid;
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
  if not found or not v_config.aceita_pagamento_antecipado or v_config.gateway_ativo = 'nenhum' then
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

  if p_itens is null or jsonb_array_length(p_itens) = 0 then
    v_assinatura_id := assinatura_disponivel_para_servico(v_cliente_id, p_servico_id);
  end if;

  begin
    insert into agendamentos (
      estabelecimento_id, cliente_id, profissional_id, servico_id,
      inicio, fim, status, origem, preco_centavos
    )
    values (
      p_estabelecimento_id, v_cliente_id, p_profissional_id, p_servico_id,
      p_inicio, v_fim, (case when v_assinatura_id is not null then 'confirmado' else 'pendente' end)::status_agendamento,
      'online', v_servico.preco_centavos
    )
    returning agendamentos.id into v_agendamento_id;
  exception when exclusion_violation then
    raise exception 'horario acabou de ser reservado por outra pessoa, escolha outro horario';
  end;

  if v_assinatura_id is not null then
    insert into pagamentos (estabelecimento_id, agendamento_id, cliente_id, valor_centavos, metodo, status, pago_em, assinatura_cliente_id)
    values (p_estabelecimento_id, v_agendamento_id, v_cliente_id, 0, 'assinatura', 'pago', now(), v_assinatura_id)
    returning pagamentos.id into v_pagamento_id;

    update assinaturas_clientes set usos_ciclo = jsonb_set(
      usos_ciclo, array[p_servico_id::text],
      to_jsonb(coalesce((usos_ciclo->>p_servico_id::text)::int, 0) + 1)
    ) where id = v_assinatura_id;

    return query select v_agendamento_id, v_pagamento_id, v_token, v_pedido_id;
    return;
  end if;

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
