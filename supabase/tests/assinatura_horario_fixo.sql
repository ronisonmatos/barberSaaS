-- Testes de verificacao do horario fixo (cliente VIP) do clube de assinatura.
-- Roda inteiro dentro de uma transacao que sempre da ROLLBACK.
-- Uso: supabase db query --linked -f supabase/tests/assinatura_horario_fixo.sql

begin;

insert into estabelecimentos (id, nome, slug, timezone, status, plano_plataforma_id)
values ('75000000-0000-0000-0000-000000000011', 'Horario Fixo Teste', 'horario-fixo-teste', 'America/Sao_Paulo', 'ativa',
  (select id from planos_plataforma where nome = 'Pro'));

insert into profissionais (id, estabelecimento_id, nome, ativo) values
  ('75000000-0000-0000-0000-000000000021', '75000000-0000-0000-0000-000000000011', 'Prof Fixo', true);

insert into servicos (id, estabelecimento_id, nome, duracao_minutos, preco_centavos, ativo) values
  ('75000000-0000-0000-0000-000000000031', '75000000-0000-0000-0000-000000000011', 'Corte Fixo', 30, 5000, true);

insert into profissional_servicos (profissional_id, servico_id) values
  ('75000000-0000-0000-0000-000000000021', '75000000-0000-0000-0000-000000000031');

do $$
declare
  v_dia_semana int := extract(dow from (current_date + interval '30 days'))::int;
begin
  insert into jornadas (estabelecimento_id, profissional_id, dia_semana, hora_inicio, hora_fim)
  values ('75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000021', v_dia_semana, '09:00', '18:00');
  if v_dia_semana <> 6 then
    insert into jornadas (estabelecimento_id, profissional_id, dia_semana, hora_inicio, hora_fim)
    values ('75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000021', 6, '09:00', '18:00');
  end if;
end $$;

insert into planos_estabelecimento (id, estabelecimento_id, nome, preco_centavos, ativo, regras) values
  ('75000000-0000-0000-0000-000000000041', '75000000-0000-0000-0000-000000000011', 'Clube Fixo', 8000, true,
    jsonb_build_array(jsonb_build_object('servico_id', '75000000-0000-0000-0000-000000000031', 'quantidade_mes', 1))),
  ('75000000-0000-0000-0000-000000000042', '75000000-0000-0000-0000-000000000011', 'Clube Fixo 2x', 12000, true,
    jsonb_build_array(jsonb_build_object('servico_id', '75000000-0000-0000-0000-000000000031', 'quantidade_mes', 2)));

insert into clientes (id, estabelecimento_id, nome, telefone) values
  ('75000000-0000-0000-0000-000000000051', '75000000-0000-0000-0000-000000000011', 'Cliente A', '+5547999993001'),
  ('75000000-0000-0000-0000-000000000052', '75000000-0000-0000-0000-000000000011', 'Cliente B', '+5547999993002'),
  ('75000000-0000-0000-0000-000000000053', '75000000-0000-0000-0000-000000000011', 'Cliente C', '+5547999993003'),
  ('75000000-0000-0000-0000-000000000054', '75000000-0000-0000-0000-000000000011', 'Cliente D', '+5547999993004'),
  ('75000000-0000-0000-0000-000000000055', '75000000-0000-0000-0000-000000000011', 'Cliente E', '+5547999993005'),
  ('75000000-0000-0000-0000-000000000056', '75000000-0000-0000-0000-000000000011', 'Cliente Ocupante', '+5547999993006'),
  ('75000000-0000-0000-0000-000000000057', '75000000-0000-0000-0000-000000000011', 'Cliente F', '+5547999993008'),
  ('75000000-0000-0000-0000-000000000058', '75000000-0000-0000-0000-000000000011', 'Cliente G', '+5547999993009');

insert into assinaturas_clientes (id, estabelecimento_id, cliente_id, plano_id, status, ciclo_inicio, ciclo_fim, usos_ciclo) values
  ('75000000-0000-0000-0000-000000000061', '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000051', '75000000-0000-0000-0000-000000000041', 'ativa', now(), now() + interval '60 days', '{}'),
  ('75000000-0000-0000-0000-000000000062', '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000052', '75000000-0000-0000-0000-000000000041', 'ativa', now(), now() + interval '60 days', jsonb_build_object('75000000-0000-0000-0000-000000000031', 1)),
  ('75000000-0000-0000-0000-000000000063', '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000053', '75000000-0000-0000-0000-000000000041', 'ativa', now(), now() + interval '60 days', '{}'),
  ('75000000-0000-0000-0000-000000000064', '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000054', '75000000-0000-0000-0000-000000000041', 'inadimplente', now(), now() + interval '60 days', '{}'),
  ('75000000-0000-0000-0000-000000000065', '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000055', '75000000-0000-0000-0000-000000000041', 'ativa', now(), now() + interval '60 days', '{}'),
  ('75000000-0000-0000-0000-000000000066', '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000057', '75000000-0000-0000-0000-000000000041', 'ativa', now(), now() + interval '150 days', '{}'),
  ('75000000-0000-0000-0000-000000000067', '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000058', '75000000-0000-0000-0000-000000000042', 'ativa', now(), now() + interval '150 days', '{}');

-- ============================================================
-- Cenario A: sucesso -- assinatura ativa, quota livre, horario livre
-- ============================================================
do $$
declare
  v_data date := current_date + interval '30 days';
  v_inicio timestamptz;
  v_horario_fixo_id uuid := '75000000-0000-0000-0000-000000000071';
  v_agendamento_id uuid;
  v_pagamento pagamentos;
begin
  select min(inicio) into v_inicio from slots_disponiveis(
    '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000021',
    '75000000-0000-0000-0000-000000000031', v_data
  );
  if v_inicio is null then
    raise exception 'cenario A: nao achou slot disponivel pra testar';
  end if;

  insert into assinatura_horarios_fixos (id, estabelecimento_id, assinatura_cliente_id, servico_id, profissional_id, intervalo_dias, horario, proxima_data, reservar_automaticamente, ativo)
  values (v_horario_fixo_id, '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000061',
    '75000000-0000-0000-0000-000000000031', '75000000-0000-0000-0000-000000000021', 15,
    to_char(v_inicio at time zone 'America/Sao_Paulo', 'HH24:MI:SS')::time, v_data, true, true);

  perform gerar_ocorrencia_horario_fixo(v_horario_fixo_id);

  select id into v_agendamento_id from agendamentos
    where estabelecimento_id = '75000000-0000-0000-0000-000000000011' and cliente_id = '75000000-0000-0000-0000-000000000051';
  if v_agendamento_id is null then
    raise exception 'cenario A: deveria ter criado o agendamento';
  end if;
  if (select status from agendamentos where id = v_agendamento_id) <> 'confirmado' then
    raise exception 'cenario A: agendamento deveria nascer confirmado';
  end if;

  select * into v_pagamento from pagamentos where agendamento_id = v_agendamento_id;
  if v_pagamento.metodo <> 'assinatura' or v_pagamento.status <> 'pago' or v_pagamento.valor_centavos <> 0 then
    raise exception 'cenario A: pagamento deveria ser metodo=assinatura, status=pago, valor=0';
  end if;

  if (select (usos_ciclo->>'75000000-0000-0000-0000-000000000031')::int from assinaturas_clientes where id = '75000000-0000-0000-0000-000000000061') <> 1 then
    raise exception 'cenario A: usos_ciclo deveria ter incrementado pra 1';
  end if;

  if (select proxima_data from assinatura_horarios_fixos where id = v_horario_fixo_id) <> v_data + 15 then
    raise exception 'cenario A: proxima_data deveria ter avancado 15 dias';
  end if;

  raise notice 'cenario A (sucesso: agendamento criado, cota consumida, proxima_data avancada): OK';
end $$;

-- ============================================================
-- Cenario B: cota do ciclo ja esgotada -- pula e avisa, nao cria agendamento
-- ============================================================
do $$
declare
  v_data date := current_date + interval '37 days'; -- +7 dias, mesmo dia da semana
  v_inicio timestamptz;
  v_horario_fixo_id uuid := '75000000-0000-0000-0000-000000000072';
  v_qtd_agendamentos int;
  v_qtd_notificacoes int;
begin
  select min(inicio) into v_inicio from slots_disponiveis(
    '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000021',
    '75000000-0000-0000-0000-000000000031', v_data
  );
  if v_inicio is null then
    raise exception 'cenario B: nao achou slot disponivel pra testar (precisa existir, mesmo que a cota bloqueie depois)';
  end if;

  insert into assinatura_horarios_fixos (id, estabelecimento_id, assinatura_cliente_id, servico_id, profissional_id, intervalo_dias, horario, proxima_data, reservar_automaticamente, ativo)
  values (v_horario_fixo_id, '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000062',
    '75000000-0000-0000-0000-000000000031', '75000000-0000-0000-0000-000000000021', 15,
    to_char(v_inicio at time zone 'America/Sao_Paulo', 'HH24:MI:SS')::time, v_data, true, true);

  perform gerar_ocorrencia_horario_fixo(v_horario_fixo_id);

  select count(*) into v_qtd_agendamentos from agendamentos where cliente_id = '75000000-0000-0000-0000-000000000052';
  if v_qtd_agendamentos <> 0 then
    raise exception 'cenario B: nao deveria ter criado agendamento (cota esgotada)';
  end if;

  select count(*) into v_qtd_notificacoes from notificacoes
    where estabelecimento_id = '75000000-0000-0000-0000-000000000011' and tipo = 'horario_fixo_pulado'
      and payload->>'assinatura_cliente_id' = '75000000-0000-0000-0000-000000000062';
  if v_qtd_notificacoes <> 1 then
    raise exception 'cenario B: deveria ter criado 1 notificacao de horario pulado';
  end if;

  if (select proxima_data from assinatura_horarios_fixos where id = v_horario_fixo_id) <> v_data + 15 then
    raise exception 'cenario B: proxima_data deveria avancar mesmo pulando';
  end if;

  raise notice 'cenario B (cota esgotada: pula, avisa, avanca proxima_data): OK';
end $$;

-- ============================================================
-- Cenario C: horario indisponivel (conflito com outro agendamento ja existente)
-- ============================================================
do $$
declare
  v_data date := current_date + interval '44 days'; -- +7 dias do cenario B, mesmo dia da semana
  v_inicio timestamptz;
  v_fim timestamptz;
  v_horario_fixo_id uuid := '75000000-0000-0000-0000-000000000073';
  v_qtd_agendamentos int;
  v_qtd_notificacoes int;
begin
  select min(inicio) into v_inicio from slots_disponiveis(
    '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000021',
    '75000000-0000-0000-0000-000000000031', v_data
  );
  if v_inicio is null then
    raise exception 'cenario C: nao achou slot disponivel pra testar';
  end if;
  v_fim := v_inicio + interval '30 minutes';

  -- Ocupa exatamente esse horario com outro cliente antes de configurar o horario fixo.
  insert into agendamentos (estabelecimento_id, cliente_id, profissional_id, servico_id, inicio, fim, status, origem, preco_centavos)
  values ('75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000056', '75000000-0000-0000-0000-000000000021',
    '75000000-0000-0000-0000-000000000031', v_inicio, v_fim, 'confirmado', 'painel', 5000);

  insert into assinatura_horarios_fixos (id, estabelecimento_id, assinatura_cliente_id, servico_id, profissional_id, intervalo_dias, horario, proxima_data, reservar_automaticamente, ativo)
  values (v_horario_fixo_id, '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000063',
    '75000000-0000-0000-0000-000000000031', '75000000-0000-0000-0000-000000000021', 15,
    to_char(v_inicio at time zone 'America/Sao_Paulo', 'HH24:MI:SS')::time, v_data, true, true);

  perform gerar_ocorrencia_horario_fixo(v_horario_fixo_id);

  select count(*) into v_qtd_agendamentos from agendamentos where cliente_id = '75000000-0000-0000-0000-000000000053';
  if v_qtd_agendamentos <> 0 then
    raise exception 'cenario C: nao deveria ter criado agendamento (horario ja ocupado)';
  end if;

  select count(*) into v_qtd_notificacoes from notificacoes
    where estabelecimento_id = '75000000-0000-0000-0000-000000000011' and tipo = 'horario_fixo_pulado'
      and payload->>'assinatura_cliente_id' = '75000000-0000-0000-0000-000000000063';
  if v_qtd_notificacoes <> 1 then
    raise exception 'cenario C: deveria ter criado 1 notificacao de horario pulado';
  end if;

  raise notice 'cenario C (horario indisponivel: pula, avisa): OK';
end $$;

-- ============================================================
-- Cenario D: assinatura fora do status ativa -- pula e avisa
-- ============================================================
do $$
declare
  v_data date := current_date + interval '51 days'; -- +7 dias do cenario C, mesmo dia da semana
  v_inicio timestamptz;
  v_horario_fixo_id uuid := '75000000-0000-0000-0000-000000000074';
  v_qtd_agendamentos int;
  v_qtd_notificacoes int;
begin
  select min(inicio) into v_inicio from slots_disponiveis(
    '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000021',
    '75000000-0000-0000-0000-000000000031', v_data
  );
  if v_inicio is null then
    raise exception 'cenario D: nao achou slot disponivel pra testar';
  end if;

  insert into assinatura_horarios_fixos (id, estabelecimento_id, assinatura_cliente_id, servico_id, profissional_id, intervalo_dias, horario, proxima_data, reservar_automaticamente, ativo)
  values (v_horario_fixo_id, '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000064',
    '75000000-0000-0000-0000-000000000031', '75000000-0000-0000-0000-000000000021', 15,
    to_char(v_inicio at time zone 'America/Sao_Paulo', 'HH24:MI:SS')::time, v_data, true, true);

  perform gerar_ocorrencia_horario_fixo(v_horario_fixo_id);

  select count(*) into v_qtd_agendamentos from agendamentos where cliente_id = '75000000-0000-0000-0000-000000000054';
  if v_qtd_agendamentos <> 0 then
    raise exception 'cenario D: nao deveria ter criado agendamento (assinatura inadimplente)';
  end if;

  select count(*) into v_qtd_notificacoes from notificacoes
    where estabelecimento_id = '75000000-0000-0000-0000-000000000011' and tipo = 'horario_fixo_pulado'
      and payload->>'assinatura_cliente_id' = '75000000-0000-0000-0000-000000000064';
  if v_qtd_notificacoes <> 1 then
    raise exception 'cenario D: deveria ter criado 1 notificacao de horario pulado';
  end if;

  raise notice 'cenario D (assinatura inadimplente: pula, avisa): OK';
end $$;

-- ============================================================
-- Cenario E: reservar_automaticamente=false -- RPC nao faz nada (nem cria, nem avisa, nem avanca)
-- ============================================================
do $$
declare
  v_data date := current_date + interval '30 days';
  v_horario_fixo_id uuid := '75000000-0000-0000-0000-000000000075';
  v_qtd_agendamentos int;
begin
  insert into assinatura_horarios_fixos (id, estabelecimento_id, assinatura_cliente_id, servico_id, profissional_id, intervalo_dias, horario, proxima_data, reservar_automaticamente, ativo)
  values (v_horario_fixo_id, '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000065',
    '75000000-0000-0000-0000-000000000031', '75000000-0000-0000-0000-000000000021', 15, '10:00', v_data, false, true);

  perform gerar_ocorrencia_horario_fixo(v_horario_fixo_id);

  select count(*) into v_qtd_agendamentos from agendamentos where cliente_id = '75000000-0000-0000-0000-000000000055';
  if v_qtd_agendamentos <> 0 then
    raise exception 'cenario E: reservar_automaticamente=false nao deveria criar nada';
  end if;

  if (select proxima_data from assinatura_horarios_fixos where id = v_horario_fixo_id) <> v_data then
    raise exception 'cenario E: reservar_automaticamente=false nao deveria avancar proxima_data';
  end if;

  raise notice 'cenario E (reservar_automaticamente=false: RPC e no-op): OK';
end $$;

-- ============================================================
-- Cenario F: recorrencia mensal ("todo 1o sabado do mes") -- sucesso e avanco correto pro mes seguinte
-- ============================================================
do $$
declare
  v_mes_1 date := date_trunc('month', current_date + interval '75 days')::date;
  v_data date := nth_dia_semana_do_mes(extract(year from v_mes_1)::int, extract(month from v_mes_1)::int, 6, 1);
  v_mes_2 date := date_trunc('month', v_data + interval '1 month')::date;
  v_data_esperada_seguinte date := nth_dia_semana_do_mes(extract(year from v_mes_2)::int, extract(month from v_mes_2)::int, 6, 1);
  v_inicio timestamptz;
  v_horario_fixo_id uuid := '75000000-0000-0000-0000-000000000076';
  v_agendamento_id uuid;
begin
  select min(inicio) into v_inicio from slots_disponiveis(
    '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000021',
    '75000000-0000-0000-0000-000000000031', v_data
  );
  if v_inicio is null then
    raise exception 'cenario F: nao achou slot disponivel no 1o sabado calculado (%)', v_data;
  end if;

  insert into assinatura_horarios_fixos (
    id, estabelecimento_id, assinatura_cliente_id, servico_id, profissional_id,
    tipo_recorrencia, dia_semana, ordinal_semana, horario, proxima_data, reservar_automaticamente, ativo
  ) values (
    v_horario_fixo_id, '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000066',
    '75000000-0000-0000-0000-000000000031', '75000000-0000-0000-0000-000000000021',
    'mensal', 6, 1, to_char(v_inicio at time zone 'America/Sao_Paulo', 'HH24:MI:SS')::time, v_data, true, true
  );

  perform gerar_ocorrencia_horario_fixo(v_horario_fixo_id);

  select id into v_agendamento_id from agendamentos
    where estabelecimento_id = '75000000-0000-0000-0000-000000000011' and cliente_id = '75000000-0000-0000-0000-000000000057';
  if v_agendamento_id is null then
    raise exception 'cenario F: deveria ter criado o agendamento no 1o sabado do mes';
  end if;
  if (select status from agendamentos where id = v_agendamento_id) <> 'confirmado' then
    raise exception 'cenario F: agendamento deveria nascer confirmado';
  end if;

  if (select proxima_data from assinatura_horarios_fixos where id = v_horario_fixo_id) <> v_data_esperada_seguinte then
    raise exception 'cenario F: proxima_data deveria avancar pro 1o sabado do mes seguinte (%), veio %',
      v_data_esperada_seguinte, (select proxima_data from assinatura_horarios_fixos where id = v_horario_fixo_id);
  end if;

  raise notice 'cenario F (recorrencia mensal: sucesso e avanco correto pro mes seguinte): OK';
end $$;

-- ============================================================
-- Cenario G: plano cobre o servico 2x/mes -- dois horarios fixos pra mesma assinatura, ambos
-- processam com sucesso na mesma janela (sem o unique(assinatura_cliente_id) que existia antes)
-- ============================================================
do $$
declare
  v_data_1 date := current_date + interval '58 days';
  v_data_2 date := current_date + interval '65 days';
  v_inicio_1 timestamptz;
  v_inicio_2 timestamptz;
  v_horario_fixo_id_1 uuid := '75000000-0000-0000-0000-000000000077';
  v_horario_fixo_id_2 uuid := '75000000-0000-0000-0000-000000000078';
  v_qtd_agendamentos int;
  v_usos_ciclo int;
begin
  select min(inicio) into v_inicio_1 from slots_disponiveis(
    '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000021',
    '75000000-0000-0000-0000-000000000031', v_data_1
  );
  select min(inicio) into v_inicio_2 from slots_disponiveis(
    '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000021',
    '75000000-0000-0000-0000-000000000031', v_data_2
  );
  if v_inicio_1 is null or v_inicio_2 is null then
    raise exception 'cenario G: nao achou slot disponivel pra testar';
  end if;

  insert into assinatura_horarios_fixos (id, estabelecimento_id, assinatura_cliente_id, servico_id, profissional_id, intervalo_dias, horario, proxima_data, reservar_automaticamente, ativo)
  values
    (v_horario_fixo_id_1, '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000067',
      '75000000-0000-0000-0000-000000000031', '75000000-0000-0000-0000-000000000021', 7,
      to_char(v_inicio_1 at time zone 'America/Sao_Paulo', 'HH24:MI:SS')::time, v_data_1, true, true),
    (v_horario_fixo_id_2, '75000000-0000-0000-0000-000000000011', '75000000-0000-0000-0000-000000000067',
      '75000000-0000-0000-0000-000000000031', '75000000-0000-0000-0000-000000000021', 7,
      to_char(v_inicio_2 at time zone 'America/Sao_Paulo', 'HH24:MI:SS')::time, v_data_2, true, true);

  perform gerar_ocorrencia_horario_fixo(v_horario_fixo_id_1);
  perform gerar_ocorrencia_horario_fixo(v_horario_fixo_id_2);

  select count(*) into v_qtd_agendamentos from agendamentos where cliente_id = '75000000-0000-0000-0000-000000000058';
  if v_qtd_agendamentos <> 2 then
    raise exception 'cenario G: os dois horarios fixos deveriam ter gerado 2 agendamentos, veio %', v_qtd_agendamentos;
  end if;

  select (usos_ciclo->>'75000000-0000-0000-0000-000000000031')::int into v_usos_ciclo
    from assinaturas_clientes where id = '75000000-0000-0000-0000-000000000067';
  if v_usos_ciclo <> 2 then
    raise exception 'cenario G: usos_ciclo deveria estar em 2 (cota do plano 2x/mes), veio %', v_usos_ciclo;
  end if;

  if (select proxima_data from assinatura_horarios_fixos where id = v_horario_fixo_id_1) <> v_data_1 + 7 then
    raise exception 'cenario G: horario fixo 1 deveria ter avancado proxima_data em 7 dias';
  end if;
  if (select proxima_data from assinatura_horarios_fixos where id = v_horario_fixo_id_2) <> v_data_2 + 7 then
    raise exception 'cenario G: horario fixo 2 deveria ter avancado proxima_data em 7 dias';
  end if;

  raise notice 'cenario G (plano 2x/mes: dois horarios fixos coexistem e consomem a cota corretamente): OK';
end $$;

rollback;
