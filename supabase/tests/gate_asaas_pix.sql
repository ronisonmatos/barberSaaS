-- Testes do gate de gateway apos liberar Pix (20260720150002) e cartao (20260720170001) via Asaas.
-- Cobre as 3 RPCs que compartilham o mesmo gate: criar_agendamento_publico_pix,
-- criar_pedido_publico_pix, criar_assinatura_publica_pix.
-- Roda inteiro dentro de uma transacao que sempre da ROLLBACK.
-- Uso: supabase db query --linked -f supabase/tests/gate_asaas_pix.sql

begin;

insert into estabelecimentos (id, nome, slug, timezone, status, plano_plataforma_id)
values
  ('80000000-0000-0000-0000-000000000001', 'Teste Asaas', 'teste-asaas', 'America/Sao_Paulo', 'ativa',
    (select id from planos_plataforma where nome = 'Pro')),
  ('80000000-0000-0000-0000-000000000002', 'Teste MP Controle', 'teste-mp-controle', 'America/Sao_Paulo', 'ativa',
    (select id from planos_plataforma where nome = 'Pro')),
  ('80000000-0000-0000-0000-000000000003', 'Teste Gateway Nenhum', 'teste-gateway-nenhum', 'America/Sao_Paulo', 'ativa',
    (select id from planos_plataforma where nome = 'Pro'));

insert into estabelecimento_pagamento_config (estabelecimento_id, gateway_ativo, asaas_api_key, aceita_pagamento_antecipado, aceita_pagamento_no_dia)
values ('80000000-0000-0000-0000-000000000001', 'asaas', '$aact_hmlg_teste', true, true);

insert into estabelecimento_pagamento_config (estabelecimento_id, gateway_ativo, mercado_pago_access_token, aceita_pagamento_antecipado, aceita_pagamento_no_dia)
values ('80000000-0000-0000-0000-000000000002', 'mercado_pago', 'TEST-token-fake', true, true);

insert into estabelecimento_pagamento_config (estabelecimento_id, gateway_ativo, aceita_pagamento_antecipado, aceita_pagamento_no_dia)
values ('80000000-0000-0000-0000-000000000003', 'nenhum', true, true);

insert into profissionais (id, estabelecimento_id, nome, ativo) values
  ('80000000-0000-0000-0000-000000000011', '80000000-0000-0000-0000-000000000001', 'Prof Asaas', true),
  ('80000000-0000-0000-0000-000000000012', '80000000-0000-0000-0000-000000000002', 'Prof MP', true);

insert into servicos (id, estabelecimento_id, nome, duracao_minutos, preco_centavos, ativo) values
  ('80000000-0000-0000-0000-000000000021', '80000000-0000-0000-0000-000000000001', 'Corte Asaas', 30, 5000, true),
  ('80000000-0000-0000-0000-000000000022', '80000000-0000-0000-0000-000000000002', 'Corte MP', 30, 5000, true);

insert into profissional_servicos (profissional_id, servico_id) values
  ('80000000-0000-0000-0000-000000000011', '80000000-0000-0000-0000-000000000021'),
  ('80000000-0000-0000-0000-000000000012', '80000000-0000-0000-0000-000000000022');

do $$
declare
  v_dia_semana int := extract(dow from ((current_date + interval '30 days')::date))::int;
begin
  insert into jornadas (estabelecimento_id, profissional_id, dia_semana, hora_inicio, hora_fim)
  values
    ('80000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000011', v_dia_semana, '09:00', '18:00'),
    ('80000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000012', v_dia_semana, '09:00', '18:00');
end $$;

insert into produtos (id, estabelecimento_id, nome, slug, preco_centavos, estoque, ativo) values
  ('80000000-0000-0000-0000-000000000031', '80000000-0000-0000-0000-000000000001', 'Produto Asaas', 'produto-asaas', 3000, 10, true);

insert into planos_estabelecimento (id, estabelecimento_id, nome, preco_centavos, ativo, regras) values
  ('80000000-0000-0000-0000-000000000041', '80000000-0000-0000-0000-000000000001', 'Clube Asaas', 8000, true,
    jsonb_build_array(jsonb_build_object('servico_id', '80000000-0000-0000-0000-000000000021', 'quantidade_mes', 2)));

-- ============================================================
-- Cenario 1: agendamento -- Pix e cartao via Asaas confirmam (cartao usa Checkout hospedado)
-- ============================================================
do $$
declare
  v_slot timestamptz;
  v_resultado record;
  v_pagamento pagamentos;
begin
  select inicio into v_slot
  from slots_disponiveis('80000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000011', '80000000-0000-0000-0000-000000000021', (current_date + interval '30 days')::date)
  limit 1;
  if v_slot is null then
    raise exception 'nenhum slot disponivel pro fixture de teste';
  end if;

  select * into v_resultado from criar_agendamento_publico_pix(
    '80000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000011', '80000000-0000-0000-0000-000000000021',
    v_slot, 'Cliente Asaas', '+5547999990001', 'cliente@exemplo.invalid', 'pix'
  );
  select * into v_pagamento from pagamentos where id = v_resultado.pagamento_id;
  if v_pagamento.status <> 'pendente' or v_pagamento.metodo <> 'pix' or v_pagamento.valor_centavos <> 5000 then
    raise exception 'pagamento criado com dados inesperados via Asaas Pix';
  end if;

  select * into v_resultado from criar_agendamento_publico_pix(
    '80000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000011', '80000000-0000-0000-0000-000000000021',
    v_slot + interval '1 hour', 'Cliente Asaas 2', '+5547999990002', 'cliente2@exemplo.invalid', 'cartao'
  );
  select * into v_pagamento from pagamentos where id = v_resultado.pagamento_id;
  if v_pagamento.status <> 'pendente' or v_pagamento.metodo <> 'cartao' then
    raise exception 'cartao via Asaas (Checkout) deveria funcionar no agendamento';
  end if;

  raise notice 'cenario 1 (agendamento: pix e cartao via asaas ok): OK';
end $$;

-- ============================================================
-- Cenario 2: cartao continua funcionando via Mercado Pago (controle, nao regrediu)
-- ============================================================
do $$
declare
  v_slot timestamptz;
  v_resultado record;
begin
  select inicio into v_slot
  from slots_disponiveis('80000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000012', '80000000-0000-0000-0000-000000000022', (current_date + interval '30 days')::date)
  limit 1;

  select * into v_resultado from criar_agendamento_publico_pix(
    '80000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000012', '80000000-0000-0000-0000-000000000022',
    v_slot, 'Cliente MP', '+5547999990003', 'clientemp@exemplo.invalid', 'cartao'
  );
  if v_resultado.pagamento_id is null then
    raise exception 'cartao via Mercado Pago deveria continuar funcionando';
  end if;
  raise notice 'cenario 2 (cartao via Mercado Pago continua ok): OK';
end $$;

-- ============================================================
-- Cenario 3: gateway 'nenhum' bloqueia tanto pix quanto cartao
-- ============================================================
do $$
begin
  begin
    perform criar_agendamento_publico_pix(
      '80000000-0000-0000-0000-000000000003', gen_random_uuid(), gen_random_uuid(), now() + interval '1 day',
      'Cliente Sem Gateway', '+5547999990004', 'clientesg@exemplo.invalid', 'pix'
    );
    raise exception 'deveria ter bloqueado pix com gateway nenhum';
  exception
    when others then
      if sqlerrm <> 'pagamento antecipado indisponivel para este estabelecimento' then
        raise exception 'esperava erro de gateway bloqueado, veio: %', sqlerrm;
      end if;
  end;

  begin
    perform criar_agendamento_publico_pix(
      '80000000-0000-0000-0000-000000000003', gen_random_uuid(), gen_random_uuid(), now() + interval '1 day',
      'Cliente Sem Gateway 2', '+5547999990008', 'clientesg2@exemplo.invalid', 'cartao'
    );
    raise exception 'deveria ter bloqueado cartao com gateway nenhum';
  exception
    when others then
      if sqlerrm <> 'pagamento antecipado indisponivel para este estabelecimento' then
        raise exception 'esperava erro de gateway bloqueado, veio: %', sqlerrm;
      end if;
  end;

  raise notice 'cenario 3 (gateway nenhum bloqueia pix e cartao): OK';
end $$;

-- ============================================================
-- Cenario 4: loja -- mesmo gate em criar_pedido_publico_pix, pix e cartao via Asaas ok
-- ============================================================
do $$
declare
  v_itens jsonb := jsonb_build_array(jsonb_build_object('produto_id', '80000000-0000-0000-0000-000000000031', 'quantidade', 1));
  v_resultado record;
begin
  select * into v_resultado from criar_pedido_publico_pix(
    '80000000-0000-0000-0000-000000000001', v_itens, 'Cliente Loja Asaas', '+5547999990005', 'clienteloja@exemplo.invalid', 'pix'
  );
  if v_resultado.pagamento_id is null then
    raise exception 'pix via Asaas deveria funcionar na loja';
  end if;

  select * into v_resultado from criar_pedido_publico_pix(
    '80000000-0000-0000-0000-000000000001', v_itens, 'Cliente Loja Asaas 2', '+5547999990006', 'clienteloja2@exemplo.invalid', 'cartao'
  );
  if v_resultado.pagamento_id is null then
    raise exception 'cartao via Asaas (Checkout) deveria funcionar na loja';
  end if;

  raise notice 'cenario 4 (loja: pix e cartao via asaas ok): OK';
end $$;

-- ============================================================
-- Cenario 5: clube -- mesmo gate em criar_assinatura_publica_pix, pix e cartao via Asaas ok
-- ============================================================
do $$
declare
  v_resultado record;
begin
  select * into v_resultado from criar_assinatura_publica_pix(
    '80000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000041',
    'Cliente Clube Asaas', '+5547999990007', 'clienteclube@exemplo.invalid', 'pix'
  );
  if v_resultado.pagamento_id is null then
    raise exception 'pix via Asaas deveria funcionar no clube de assinatura';
  end if;

  select * into v_resultado from criar_assinatura_publica_pix(
    '80000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000041',
    'Cliente Clube Asaas', '+5547999990007', 'clienteclube@exemplo.invalid', 'cartao'
  );
  if v_resultado.pagamento_id is null then
    raise exception 'cartao via Asaas (Checkout) deveria funcionar no clube';
  end if;

  raise notice 'cenario 5 (clube: pix e cartao via asaas ok): OK';
end $$;

rollback;
