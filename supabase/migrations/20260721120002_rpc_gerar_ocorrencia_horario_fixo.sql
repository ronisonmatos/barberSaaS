-- Gera (ou pula, avisando a equipe) a proxima ocorrencia de um horario fixo. Uma linha por
-- tentativa: sempre avanca proxima_data em intervalo_dias ao final, sucesso ou nao -- nunca fica
-- tentando o mesmo ciclo perdido de novo (decisao do usuario: "pula e avisa", nao "trava tudo").
-- Chamada pelo cron web/app/api/cron/gerar-horarios-fixos, uma vez por linha elegivel.
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
begin
  select * into v_regra from assinatura_horarios_fixos
    where id = p_horario_fixo_id and ativo and reservar_automaticamente
    for update;
  if not found then
    return;
  end if;

  select * into v_assinatura from assinaturas_clientes where id = v_regra.assinatura_cliente_id for update;
  select * into v_servico from servicos where id = v_regra.servico_id;
  select * into v_estabelecimento from estabelecimentos where id = v_regra.estabelecimento_id;
  select * into v_cliente from clientes where id = v_assinatura.cliente_id;

  v_inicio := ((v_regra.proxima_data::text || ' ' || v_regra.horario::text)::timestamp at time zone v_estabelecimento.timezone);
  v_fim := v_inicio + (v_servico.duracao_minutos || ' minutes')::interval;

  -- Assinatura precisa estar ativa, dentro do ciclo pago, e o plano do estabelecimento ainda
  -- precisa permitir clube de assinatura (pode ter sido rebaixado desde que o horario fixo foi
  -- configurado).
  if v_assinatura.status <> 'ativa'
     or v_assinatura.ciclo_fim < v_inicio
     or not estabelecimento_permite_clube_assinatura(v_regra.estabelecimento_id) then
    insert into notificacoes (estabelecimento_id, tipo, titulo, descricao, payload)
    values (
      v_regra.estabelecimento_id, 'horario_fixo_pulado', 'Horário fixo não pôde ser reservado',
      coalesce(v_cliente.nome, 'Cliente') || ' -- assinatura inativa ou fora do ciclo, não foi possível reservar automaticamente.',
      jsonb_build_object('assinatura_cliente_id', v_assinatura.id, 'data', v_regra.proxima_data)
    );
    update assinatura_horarios_fixos set proxima_data = proxima_data + v_regra.intervalo_dias where id = p_horario_fixo_id;
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
    update assinatura_horarios_fixos set proxima_data = proxima_data + v_regra.intervalo_dias where id = p_horario_fixo_id;
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
    update assinatura_horarios_fixos set proxima_data = proxima_data + v_regra.intervalo_dias where id = p_horario_fixo_id;
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
    update assinatura_horarios_fixos set proxima_data = proxima_data + v_regra.intervalo_dias where id = p_horario_fixo_id;
    return;
  end;

  insert into pagamentos (estabelecimento_id, agendamento_id, cliente_id, valor_centavos, metodo, status, pago_em, assinatura_cliente_id)
  values (v_regra.estabelecimento_id, v_agendamento_id, v_assinatura.cliente_id, 0, 'assinatura', 'pago', now(), v_assinatura.id);

  update assinaturas_clientes set usos_ciclo = jsonb_set(
    usos_ciclo, array[v_regra.servico_id::text],
    to_jsonb(coalesce((usos_ciclo->>v_regra.servico_id::text)::int, 0) + 1)
  ) where id = v_assinatura.id;

  update assinatura_horarios_fixos set proxima_data = proxima_data + v_regra.intervalo_dias where id = p_horario_fixo_id;
end;
$$;
