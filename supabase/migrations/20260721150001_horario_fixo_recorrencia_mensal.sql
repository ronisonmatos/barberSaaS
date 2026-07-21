-- Feedback do usuario apos ver o horario fixo em uso: existe um segundo padrao de recorrencia
-- que "a cada N dias" nao cobre -- ex: "todo primeiro sabado do mes" nao e um intervalo fixo de
-- dias (meses tem tamanhos diferentes, entao a data do 1o sabado varia). Adiciona um segundo tipo
-- de recorrencia: mensal por posicao do dia da semana (1a/2a/3a/4a ocorrencia, ou a ultima).
alter table assinatura_horarios_fixos
  add column tipo_recorrencia text not null default 'intervalo' check (tipo_recorrencia in ('intervalo', 'mensal')),
  add column dia_semana int check (dia_semana between 0 and 6),
  add column ordinal_semana int check (ordinal_semana in (1, 2, 3, 4, -1)),
  alter column intervalo_dias drop not null;

alter table assinatura_horarios_fixos
  add constraint horario_fixo_recorrencia_coerente check (
    (tipo_recorrencia = 'intervalo' and intervalo_dias is not null and dia_semana is null and ordinal_semana is null)
    or
    (tipo_recorrencia = 'mensal' and intervalo_dias is null and dia_semana is not null and ordinal_semana is not null)
  );

-- Calcula a data da N-esima ocorrencia (ou a ultima, com p_ordinal = -1) de um dia da semana num
-- mes/ano especifico. p_dia_semana segue a convencao de extract(dow from ...): 0 = domingo.
create or replace function nth_dia_semana_do_mes(p_ano int, p_mes int, p_dia_semana int, p_ordinal int) returns date
language plpgsql immutable as $$
declare
  v_primeiro_dia date := make_date(p_ano, p_mes, 1);
  v_ultimo_dia date := (make_date(p_ano, p_mes, 1) + interval '1 month - 1 day')::date;
  v_dia date;
begin
  if p_ordinal = -1 then
    v_dia := v_ultimo_dia;
    while extract(dow from v_dia)::int <> p_dia_semana loop
      v_dia := v_dia - 1;
    end loop;
    return v_dia;
  end if;

  v_dia := v_primeiro_dia;
  while extract(dow from v_dia)::int <> p_dia_semana loop
    v_dia := v_dia + 1;
  end loop;
  v_dia := v_dia + ((p_ordinal - 1) * 7);
  if extract(month from v_dia)::int <> p_mes then
    raise exception 'o mes %-% nao tem uma %a ocorrencia do dia da semana %', p_ano, p_mes, p_ordinal, p_dia_semana;
  end if;
  return v_dia;
end;
$$;

-- Regenera gerar_ocorrencia_horario_fixo: unica mudanca e como a proxima_data avanca no final
-- (intervalo fixo de dias, ou proxima ocorrencia mensal do dia da semana configurado) -- calculado
-- uma vez em v_proxima_data_seguinte e reaproveitado nos 4 pontos que antes repetiam
-- "proxima_data + intervalo_dias".
create or replace function gerar_ocorrencia_horario_fixo(p_horario_fixo_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_regra assinatura_horarios_fixos;
  v_assinatura assinaturas_clientes;
  v_servico servicos;
  v_estabelecimento estabelecimentos;
  v_cliente clientes;
  v_inicio timestamptz;
  v_fim timestamptz;
  v_assinatura_disponivel_id uuid;
  v_agendamento_id uuid;
  v_proxima_data_seguinte date;
  v_mes_seguinte date;
begin
  select * into v_regra from assinatura_horarios_fixos
    where id = p_horario_fixo_id and ativo and reservar_automaticamente
    for update;
  if not found then
    return;
  end if;

  if v_regra.tipo_recorrencia = 'mensal' then
    v_mes_seguinte := date_trunc('month', v_regra.proxima_data + interval '1 month')::date;
    v_proxima_data_seguinte := nth_dia_semana_do_mes(
      extract(year from v_mes_seguinte)::int, extract(month from v_mes_seguinte)::int,
      v_regra.dia_semana, v_regra.ordinal_semana
    );
  else
    v_proxima_data_seguinte := v_regra.proxima_data + v_regra.intervalo_dias;
  end if;

  select * into v_assinatura from assinaturas_clientes where id = v_regra.assinatura_cliente_id for update;
  select * into v_servico from servicos where id = v_regra.servico_id;
  select * into v_estabelecimento from estabelecimentos where id = v_regra.estabelecimento_id;
  select * into v_cliente from clientes where id = v_assinatura.cliente_id;

  v_inicio := ((v_regra.proxima_data::text || ' ' || v_regra.horario::text)::timestamp at time zone v_estabelecimento.timezone);
  v_fim := v_inicio + (v_servico.duracao_minutos || ' minutes')::interval;

  if v_assinatura.status <> 'ativa'
     or v_assinatura.ciclo_fim < v_inicio
     or not estabelecimento_permite_clube_assinatura(v_regra.estabelecimento_id) then
    insert into notificacoes (estabelecimento_id, tipo, titulo, descricao, payload)
    values (
      v_regra.estabelecimento_id, 'horario_fixo_pulado', 'Horário fixo não pôde ser reservado',
      coalesce(v_cliente.nome, 'Cliente') || ' -- assinatura inativa ou fora do ciclo, não foi possível reservar automaticamente.',
      jsonb_build_object('assinatura_cliente_id', v_assinatura.id, 'data', v_regra.proxima_data)
    );
    update assinatura_horarios_fixos set proxima_data = v_proxima_data_seguinte where id = p_horario_fixo_id;
    return;
  end if;

  v_assinatura_disponivel_id := assinatura_disponivel_para_servico(v_assinatura.cliente_id, v_regra.servico_id);
  if v_assinatura_disponivel_id is null then
    insert into notificacoes (estabelecimento_id, tipo, titulo, descricao, payload)
    values (
      v_regra.estabelecimento_id, 'horario_fixo_pulado', 'Horário fixo não pôde ser reservado',
      coalesce(v_cliente.nome, 'Cliente') || ' -- cota do ciclo já foi usada, não foi possível reservar automaticamente.',
      jsonb_build_object('assinatura_cliente_id', v_assinatura.id, 'data', v_regra.proxima_data)
    );
    update assinatura_horarios_fixos set proxima_data = v_proxima_data_seguinte where id = p_horario_fixo_id;
    return;
  end if;

  if not exists (
    select 1 from slots_disponiveis(v_regra.estabelecimento_id, v_regra.profissional_id, v_regra.servico_id, v_regra.proxima_data)
    where inicio = v_inicio
  ) then
    insert into notificacoes (estabelecimento_id, tipo, titulo, descricao, payload)
    values (
      v_regra.estabelecimento_id, 'horario_fixo_pulado', 'Horário fixo não pôde ser reservado',
      coalesce(v_cliente.nome, 'Cliente') || ' -- horário indisponível (bloqueio, feriado ou profissional ocupado), não foi possível reservar automaticamente.',
      jsonb_build_object('assinatura_cliente_id', v_assinatura.id, 'data', v_regra.proxima_data)
    );
    update assinatura_horarios_fixos set proxima_data = v_proxima_data_seguinte where id = p_horario_fixo_id;
    return;
  end if;

  begin
    insert into agendamentos (
      estabelecimento_id, cliente_id, profissional_id, servico_id,
      inicio, fim, status, origem, preco_centavos, assinatura_cliente_id
    )
    values (
      v_regra.estabelecimento_id, v_assinatura.cliente_id, v_regra.profissional_id, v_regra.servico_id,
      v_inicio, v_fim, 'confirmado', 'painel', v_servico.preco_centavos, v_assinatura.id
    )
    returning id into v_agendamento_id;
  exception when exclusion_violation then
    insert into notificacoes (estabelecimento_id, tipo, titulo, descricao, payload)
    values (
      v_regra.estabelecimento_id, 'horario_fixo_pulado', 'Horário fixo não pôde ser reservado',
      coalesce(v_cliente.nome, 'Cliente') || ' -- horário acabou de ser ocupado, não foi possível reservar automaticamente.',
      jsonb_build_object('assinatura_cliente_id', v_assinatura.id, 'data', v_regra.proxima_data)
    );
    update assinatura_horarios_fixos set proxima_data = v_proxima_data_seguinte where id = p_horario_fixo_id;
    return;
  end;

  insert into pagamentos (estabelecimento_id, agendamento_id, cliente_id, valor_centavos, metodo, status, pago_em, assinatura_cliente_id)
  values (v_regra.estabelecimento_id, v_agendamento_id, v_assinatura.cliente_id, 0, 'assinatura', 'pago', now(), v_assinatura.id);

  update assinaturas_clientes set usos_ciclo = jsonb_set(
    usos_ciclo, array[v_regra.servico_id::text],
    to_jsonb(coalesce((usos_ciclo->>v_regra.servico_id::text)::int, 0) + 1)
  ) where id = v_assinatura.id;

  update assinatura_horarios_fixos set proxima_data = v_proxima_data_seguinte where id = p_horario_fixo_id;
end;
$$;
