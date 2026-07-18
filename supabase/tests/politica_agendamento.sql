-- Testes de verificacao da politica de agendamento (cancelamento fora do prazo + remarcacao)
-- introduzida em 20260718100004_politica_agendamento_e_remarcacao.sql.
-- Roda inteiro dentro de uma transacao que sempre da ROLLBACK.
-- Uso: supabase db query --linked -f supabase/tests/politica_agendamento.sql

begin;

insert into estabelecimentos (id, nome, slug, timezone, status, config)
values (
  '70000000-0000-0000-0000-000000000001',
  'Estabelecimento Teste Politica',
  'estabelecimento-teste-politica',
  'America/Sao_Paulo',
  'ativa',
  '{"antecedencia_min_horas": 0, "antecedencia_cancelamento_horas": 2, "antecedencia_remarcacao_horas": 2}'
);

insert into profissionais (id, estabelecimento_id, nome, ativo)
values ('70000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'Profissional Teste', true);

insert into servicos (id, estabelecimento_id, nome, duracao_minutos, preco_centavos, ativo)
values ('70000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000001', 'Corte 30min', 30, 4000, true);

insert into profissional_servicos (profissional_id, servico_id)
values ('70000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000003');

-- Jornada de uma proxima data fixa (30 dias a frente), mesmo padrao de slots_disponiveis.sql,
-- usada so pelos cenarios de remarcacao (que precisam de um slot novo valido pra mover para).
do $$
declare
  v_data date := current_date + interval '30 days';
  v_dia_semana int := extract(dow from (current_date + interval '30 days'))::int;
begin
  insert into jornadas (estabelecimento_id, profissional_id, dia_semana, hora_inicio, hora_fim)
  values ('70000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', v_dia_semana, '09:00', '19:00');
end $$;

insert into clientes (id, estabelecimento_id, nome, telefone, token_acesso)
values
  ('70000000-0000-0000-0000-0000000000c1', '70000000-0000-0000-0000-000000000001', 'Cliente Dentro Prazo', '+5547900000001', gen_random_uuid()),
  ('70000000-0000-0000-0000-0000000000c2', '70000000-0000-0000-0000-000000000001', 'Cliente Fora Prazo', '+5547900000002', gen_random_uuid());

-- ============================================================
-- Cenario 1: cancelar dentro do prazo (10h de antecedencia, prazo exigido = 2h)
-- ============================================================
do $$
declare
  v_token uuid;
  v_agendamento_id uuid;
  v_status status_agendamento;
  v_fora_prazo boolean;
begin
  select token_acesso into v_token from clientes where id = '70000000-0000-0000-0000-0000000000c1';

  insert into agendamentos (id, estabelecimento_id, cliente_id, profissional_id, servico_id, inicio, fim, status, preco_centavos)
  values (
    '70000000-0000-0000-0000-00000000a001',
    '70000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-0000000000c1',
    '70000000-0000-0000-0000-000000000002',
    '70000000-0000-0000-0000-000000000003',
    now() + interval '10 hours',
    now() + interval '10 hours 30 minutes',
    'confirmado',
    4000
  ) returning id into v_agendamento_id;

  perform cancelar_agendamento_via_token(v_token, v_agendamento_id);

  select status, cancelado_fora_do_prazo into v_status, v_fora_prazo
  from agendamentos where id = v_agendamento_id;

  if v_status <> 'cancelado' then
    raise exception 'FALHOU cenario 1: esperava status cancelado, veio %', v_status;
  end if;
  if v_fora_prazo is not false then
    raise exception 'FALHOU cenario 1: cancelamento dentro do prazo nao deveria marcar cancelado_fora_do_prazo';
  end if;
  raise notice 'OK cenario 1: cancelar dentro do prazo (sem flag)';
end $$;

-- ============================================================
-- Cenario 2: cancelar fora do prazo (1h de antecedencia, prazo exigido = 2h) -- permite, mas marca
-- ============================================================
do $$
declare
  v_token uuid;
  v_agendamento_id uuid;
  v_status status_agendamento;
  v_fora_prazo boolean;
begin
  select token_acesso into v_token from clientes where id = '70000000-0000-0000-0000-0000000000c2';

  insert into agendamentos (id, estabelecimento_id, cliente_id, profissional_id, servico_id, inicio, fim, status, preco_centavos)
  values (
    '70000000-0000-0000-0000-00000000a002',
    '70000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-0000000000c2',
    '70000000-0000-0000-0000-000000000002',
    '70000000-0000-0000-0000-000000000003',
    now() + interval '1 hours',
    now() + interval '1 hours 30 minutes',
    'confirmado',
    4000
  ) returning id into v_agendamento_id;

  perform cancelar_agendamento_via_token(v_token, v_agendamento_id);

  select status, cancelado_fora_do_prazo into v_status, v_fora_prazo
  from agendamentos where id = v_agendamento_id;

  if v_status <> 'cancelado' then
    raise exception 'FALHOU cenario 2: cancelamento fora do prazo deveria ser permitido (nao bloqueado), status veio %', v_status;
  end if;
  if v_fora_prazo is not true then
    raise exception 'FALHOU cenario 2: cancelamento fora do prazo deveria marcar cancelado_fora_do_prazo = true';
  end if;
  raise notice 'OK cenario 2: cancelar fora do prazo (permite e marca a flag)';
end $$;

-- ============================================================
-- Cenario 3: remarcar dentro do prazo -- sucesso
-- ============================================================
do $$
declare
  v_token uuid;
  v_agendamento_id uuid;
  v_data date := current_date + interval '30 days';
  v_novo_inicio timestamptz;
  v_inicio_atual timestamptz;
begin
  select token_acesso into v_token from clientes where id = '70000000-0000-0000-0000-0000000000c1';

  insert into agendamentos (id, estabelecimento_id, cliente_id, profissional_id, servico_id, inicio, fim, status, preco_centavos)
  values (
    '70000000-0000-0000-0000-00000000a003',
    '70000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-0000000000c1',
    '70000000-0000-0000-0000-000000000002',
    '70000000-0000-0000-0000-000000000003',
    now() + interval '10 hours',
    now() + interval '10 hours 30 minutes',
    'confirmado',
    4000
  );

  select min(inicio) into v_novo_inicio
  from slots_disponiveis(
    '70000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000002',
    '70000000-0000-0000-0000-000000000003',
    v_data
  );

  if v_novo_inicio is null then
    raise exception 'FALHOU cenario 3: setup nao gerou nenhum slot disponivel pra remarcar';
  end if;

  perform remarcar_agendamento_via_token(v_token, '70000000-0000-0000-0000-00000000a003', v_novo_inicio);

  select inicio into v_inicio_atual from agendamentos where id = '70000000-0000-0000-0000-00000000a003';
  if v_inicio_atual <> v_novo_inicio then
    raise exception 'FALHOU cenario 3: inicio nao foi atualizado pro novo horario';
  end if;
  raise notice 'OK cenario 3: remarcar dentro do prazo (sucesso)';
end $$;

-- ============================================================
-- Cenario 4: remarcar fora do prazo (1h de antecedencia, prazo exigido = 2h) -- bloqueado
-- ============================================================
do $$
declare
  v_token uuid;
  v_erro_capturado boolean := false;
begin
  select token_acesso into v_token from clientes where id = '70000000-0000-0000-0000-0000000000c2';

  insert into agendamentos (id, estabelecimento_id, cliente_id, profissional_id, servico_id, inicio, fim, status, preco_centavos)
  values (
    '70000000-0000-0000-0000-00000000a004',
    '70000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-0000000000c2',
    '70000000-0000-0000-0000-000000000002',
    '70000000-0000-0000-0000-000000000003',
    now() + interval '1 hours',
    now() + interval '1 hours 30 minutes',
    'confirmado',
    4000
  );

  begin
    perform remarcar_agendamento_via_token(v_token, '70000000-0000-0000-0000-00000000a004', now() + interval '50 hours');
  exception
    when others then
      if sqlerrm <> 'fora do prazo permitido para remarcar' then
        raise exception 'FALHOU cenario 4: esperava erro de prazo, veio: %', sqlerrm;
      end if;
      v_erro_capturado := true;
  end;

  if not v_erro_capturado then
    raise exception 'FALHOU cenario 4: remarcacao fora do prazo deveria ter sido bloqueada';
  end if;
  raise notice 'OK cenario 4: remarcar fora do prazo bloqueado';
end $$;

-- ============================================================
-- Cenario 5: remarcar para horario indisponivel (ja ocupado por outro agendamento) -- bloqueado
-- ============================================================
do $$
declare
  v_token uuid;
  v_data date := current_date + interval '30 days';
  v_slot_ocupado timestamptz;
  v_erro_capturado boolean := false;
begin
  select token_acesso into v_token from clientes where id = '70000000-0000-0000-0000-0000000000c1';

  -- horario ja ocupado pelo proprio agendamento a003 (remarcado no cenario 3)
  select inicio into v_slot_ocupado from agendamentos where id = '70000000-0000-0000-0000-00000000a003';

  insert into agendamentos (id, estabelecimento_id, cliente_id, profissional_id, servico_id, inicio, fim, status, preco_centavos)
  values (
    '70000000-0000-0000-0000-00000000a005',
    '70000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-0000000000c1',
    '70000000-0000-0000-0000-000000000002',
    '70000000-0000-0000-0000-000000000003',
    now() + interval '11 hours',
    now() + interval '11 hours 30 minutes',
    'confirmado',
    4000
  );

  begin
    perform remarcar_agendamento_via_token(v_token, '70000000-0000-0000-0000-00000000a005', v_slot_ocupado);
  exception
    when others then
      if sqlerrm <> 'horario indisponivel' then
        raise exception 'FALHOU cenario 5: esperava erro de horario indisponivel, veio: %', sqlerrm;
      end if;
      v_erro_capturado := true;
  end;

  if not v_erro_capturado then
    raise exception 'FALHOU cenario 5: remarcacao para horario ja ocupado deveria ter sido bloqueada';
  end if;
  raise notice 'OK cenario 5: remarcar para horario indisponivel bloqueado';
end $$;

do $$
begin
  raise notice '=== TODOS OS CENARIOS DE politica_agendamento PASSARAM ===';
end $$;

rollback;
