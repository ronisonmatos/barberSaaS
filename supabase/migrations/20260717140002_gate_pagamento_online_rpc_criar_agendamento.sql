-- Mesma checagem de plano de formas_pagamento_publico, mas na RPC que efetivamente cria o
-- agendamento pago -- a UI esconder a opcao nao impede alguem de chamar a RPC direto.
create or replace function criar_agendamento_publico_pix(
  p_estabelecimento_id uuid,
  p_profissional_id uuid,
  p_servico_id uuid,
  p_inicio timestamptz,
  p_nome text,
  p_telefone text,
  p_email text,
  p_metodo metodo_pagamento default 'pix'
) returns table (agendamento_id uuid, pagamento_id uuid, token_acesso uuid)
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

  insert into pagamentos (estabelecimento_id, agendamento_id, cliente_id, valor_centavos, metodo, status)
  values (p_estabelecimento_id, v_agendamento_id, v_cliente_id, v_servico.preco_centavos, p_metodo, 'pendente')
  returning pagamentos.id into v_pagamento_id;

  return query select v_agendamento_id, v_pagamento_id, v_token;
end;
$$;
