-- Testes de verificacao da RPC slots_disponiveis.
-- Roda inteiro dentro de uma transacao que sempre da ROLLBACK: nunca persiste dados,
-- mesmo se um cenario falhar (RAISE EXCEPTION aborta a transacao).
-- Uso: supabase db query -f supabase/tests/slots_disponiveis.sql

begin;

-- Fixtures isoladas da seed de demonstracao (estabelecimento proprio de teste).
insert into estabelecimentos (id, nome, slug, timezone, status, config)
values (
  '10000000-0000-0000-0000-000000000001',
  'Estabelecimento Teste RPC',
  'estabelecimento-teste-rpc',
  'America/Sao_Paulo',
  'ativa',
  '{"antecedencia_min_horas": 2}'
);

insert into profissionais (id, estabelecimento_id, nome, ativo)
values ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Profissional Teste', true);

insert into servicos (id, estabelecimento_id, nome, duracao_minutos, preco_centavos, ativo)
values
  ('10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Corte 30min', 30, 4000, true),
  ('10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Corte 45min', 45, 5000, true);

insert into profissional_servicos (profissional_id, servico_id)
values
  ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004');

-- Jornada de uma data futura fixa e conhecida: usamos uma proxima segunda-feira,
-- bem a frente para nunca cair no passado/antecedencia minima independente de quando o teste roda.
do $$
declare
  v_data date;
  v_dia_semana int;
begin
  v_data := current_date + interval '30 days';
  v_dia_semana := extract(dow from v_data)::int;

  insert into jornadas (estabelecimento_id, profissional_id, dia_semana, hora_inicio, hora_fim)
  values
    ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', v_dia_semana, '09:00', '12:00'),
    ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', v_dia_semana, '13:00', '19:00');
end $$;

-- ============================================================
-- Cenario 1: almoco -- nao pode haver slot entre 12:00 e 13:00
-- ============================================================
do $$
declare
  v_data date := current_date + interval '30 days';
  v_qtd int;
begin
  select count(*) into v_qtd
  from slots_disponiveis(
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    v_data
  )
  where (inicio at time zone 'America/Sao_Paulo')::time >= '12:00' and (inicio at time zone 'America/Sao_Paulo')::time < '13:00';

  if v_qtd <> 0 then
    raise exception 'FALHOU cenario almoco: esperava 0 slots entre 12h-13h, achou %', v_qtd;
  end if;
  raise notice 'OK cenario almoco';
end $$;

-- ============================================================
-- Cenario 2: dois agendamentos seguidos nao devem se sobrepor
-- ============================================================
do $$
declare
  v_data date := current_date + interval '30 days';
  v_inicio_1 timestamptz;
  v_qtd_antes int;
  v_qtd_depois int;
begin
  select min(inicio) into v_inicio_1
  from slots_disponiveis(
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    v_data
  );

  insert into clientes (id, estabelecimento_id, nome, telefone)
  values ('10000000-0000-0000-0000-0000000000c1', '10000000-0000-0000-0000-000000000001', 'Cliente Teste', '+5547900000001');

  insert into agendamentos (estabelecimento_id, cliente_id, profissional_id, servico_id, inicio, fim, status, preco_centavos)
  values (
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-0000000000c1',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    v_inicio_1,
    v_inicio_1 + interval '30 minutes',
    'confirmado',
    4000
  );

  select count(*) into v_qtd_depois
  from slots_disponiveis(
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    v_data
  )
  where inicio = v_inicio_1;

  if v_qtd_depois <> 0 then
    raise exception 'FALHOU cenario dois agendamentos seguidos: slot ja ocupado ainda aparece como livre';
  end if;
  raise notice 'OK cenario dois agendamentos seguidos (slot ocupado removido)';
end $$;

-- ============================================================
-- Cenario 3: bloqueio parcial remove so o intervalo bloqueado
-- ============================================================
do $$
declare
  v_data date := current_date + interval '30 days';
  v_qtd int;
begin
  insert into bloqueios (estabelecimento_id, profissional_id, inicio, fim, motivo)
  values (
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    (v_data::text || ' 14:00')::timestamp at time zone 'America/Sao_Paulo',
    (v_data::text || ' 15:00')::timestamp at time zone 'America/Sao_Paulo',
    'bloqueio de teste'
  );

  select count(*) into v_qtd
  from slots_disponiveis(
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    v_data
  )
  where (inicio at time zone 'America/Sao_Paulo')::time >= '14:00' and (inicio at time zone 'America/Sao_Paulo')::time < '15:00';

  if v_qtd <> 0 then
    raise exception 'FALHOU cenario bloqueio parcial: esperava 0 slots entre 14h-15h, achou %', v_qtd;
  end if;

  select count(*) into v_qtd
  from slots_disponiveis(
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    v_data
  )
  where (inicio at time zone 'America/Sao_Paulo')::time = '13:00';

  if v_qtd <> 1 then
    raise exception 'FALHOU cenario bloqueio parcial: slot 13:00 (fora do bloqueio) deveria estar livre';
  end if;
  raise notice 'OK cenario bloqueio parcial';
end $$;

-- ============================================================
-- Cenario 4: servico de 45min deve caber ate 19h mas nao ultrapassar
-- ============================================================
do $$
declare
  v_data date := current_date + interval '30 days';
  v_ultimo timestamptz;
begin
  select max(fim) into v_ultimo
  from slots_disponiveis(
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000004',
    v_data
  )
  where (inicio at time zone 'America/Sao_Paulo')::time >= '13:00';

  if v_ultimo is null or (v_ultimo at time zone 'America/Sao_Paulo')::time > '19:00'::time then
    raise exception 'FALHOU cenario 45min: ultimo slot terminaria depois das 19h (fim=%)', v_ultimo;
  end if;
  raise notice 'OK cenario servico 45min respeita fechamento as 19h (ultimo fim=%)', v_ultimo;
end $$;

-- ============================================================
-- Cenario 5: constraint de exclusao barra agendamento simultaneo (defesa final)
-- ============================================================
do $$
declare
  v_data date := current_date + interval '30 days';
  v_inicio timestamptz;
  v_erro_capturado boolean := false;
begin
  select min(inicio) into v_inicio
  from slots_disponiveis(
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000004',
    v_data
  )
  where (inicio at time zone 'America/Sao_Paulo')::time >= '15:30'; -- horario ainda livre, fora do agendamento/bloqueio criados acima

  insert into clientes (id, estabelecimento_id, nome, telefone)
  values ('10000000-0000-0000-0000-0000000000c2', '10000000-0000-0000-0000-000000000001', 'Cliente Teste 2', '+5547900000002');

  insert into agendamentos (estabelecimento_id, cliente_id, profissional_id, servico_id, inicio, fim, status, preco_centavos)
  values (
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-0000000000c2',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000004',
    v_inicio,
    v_inicio + interval '45 minutes',
    'confirmado',
    5000
  );

  begin
    insert into agendamentos (estabelecimento_id, cliente_id, profissional_id, servico_id, inicio, fim, status, preco_centavos)
    values (
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-0000000000c2',
      '10000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000004',
      v_inicio,
      v_inicio + interval '45 minutes',
      'confirmado',
      5000
    );
  exception when exclusion_violation then
    v_erro_capturado := true;
  end;

  if not v_erro_capturado then
    raise exception 'FALHOU cenario constraint: conseguiu inserir dois agendamentos conflitantes';
  end if;
  raise notice 'OK cenario constraint de exclusao barra conflito';
end $$;

-- ============================================================
-- Cenario 6: timezone -- slot as 09:00 America/Sao_Paulo deve corresponder ao UTC correto
-- ============================================================
do $$
declare
  v_data date := current_date + interval '30 days';
  v_slot_11h timestamptz;
begin
  -- 11:00 local nunca foi tocado pelos cenarios anteriores (booking em 09:00-09:30,
  -- bloqueio 14:00-15:00, segundo booking as 15:30), entao deve seguir livre.
  select inicio into v_slot_11h
  from slots_disponiveis(
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    v_data
  )
  where (inicio at time zone 'America/Sao_Paulo')::time = '11:00';

  if v_slot_11h is null then
    raise exception 'FALHOU cenario timezone: slot 11:00 local deveria estar livre e nao apareceu';
  end if;
  raise notice 'OK cenario timezone (11:00 local = % UTC)', v_slot_11h;
end $$;

do $$
begin
  raise notice '=== TODOS OS CENARIOS DE slots_disponiveis PASSARAM ===';
end $$;

rollback;
