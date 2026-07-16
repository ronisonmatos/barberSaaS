-- Rename "barbearia" -> "estabelecimento": RPCs. Corpos de funcao sao texto armazenado
-- e nao acompanham o rename de tabela/coluna sozinhos, entao cada uma precisa ser
-- recriada. Onde so o nome muda (nao a assinatura), usamos ALTER FUNCTION RENAME
-- (preserva OID e grants) seguido de CREATE OR REPLACE para corrigir o corpo.
-- agendamento_por_token muda os nomes das colunas de retorno, entao exige DROP+CREATE
-- (CREATE OR REPLACE nao permite renomear colunas de RETURNS TABLE) e precisa re-grant.

alter function minhas_barbearias() rename to meus_estabelecimentos;

create or replace function meus_estabelecimentos() returns setof uuid
language sql stable security definer set search_path = public as $$
  select estabelecimento_id from membros_estabelecimento where usuario_id = auth.uid();
$$;

alter function onboarding_criar_barbearia(text, text) rename to onboarding_criar_estabelecimento;

create or replace function onboarding_criar_estabelecimento(p_nome text, p_slug text)
returns estabelecimentos
language plpgsql security definer set search_path = public as $$
declare
  v_estabelecimento estabelecimentos;
begin
  if auth.uid() is null then
    raise exception 'nao autenticado';
  end if;

  if exists (select 1 from membros_estabelecimento where usuario_id = auth.uid()) then
    raise exception 'usuario ja possui um estabelecimento';
  end if;

  insert into estabelecimentos (nome, slug, status, trial_ate, config)
  values (
    p_nome,
    p_slug,
    'trial',
    (current_date + interval '14 days')::date,
    '{"modo_cobranca_default": "no_local", "percentual_sinal": 30, "antecedencia_min_horas": 2}'
  )
  returning * into v_estabelecimento;

  insert into membros_estabelecimento (estabelecimento_id, usuario_id, papel)
  values (v_estabelecimento.id, auth.uid(), 'owner');

  return v_estabelecimento;
end;
$$;

-- CREATE OR REPLACE nao permite renomear parametros de entrada (p_barbearia_id ->
-- p_estabelecimento_id), entao exige DROP+CREATE, com re-grant.
drop function slots_disponiveis(uuid, uuid, uuid, date);

create function slots_disponiveis(
  p_estabelecimento_id uuid,
  p_profissional_id uuid,
  p_servico_id uuid,
  p_data date
) returns table (inicio timestamptz, fim timestamptz)
language sql stable security definer set search_path = public as $$
  with estabelecimento as (
    select timezone, coalesce((config->>'antecedencia_min_horas')::numeric, 2) as antecedencia_horas
    from estabelecimentos
    where id = p_estabelecimento_id
  ),
  servico as (
    select s.duracao_minutos
    from servicos s
    where s.id = p_servico_id
      and s.estabelecimento_id = p_estabelecimento_id
      and s.ativo
      and exists (
        select 1 from profissional_servicos ps
        where ps.servico_id = s.id and ps.profissional_id = p_profissional_id
      )
  ),
  dia as (
    select extract(dow from p_data)::int as dia_semana
  ),
  janelas as (
    select
      ((p_data::text || ' ' || j.hora_inicio::text)::timestamp at time zone e.timezone) as inicio_janela,
      ((p_data::text || ' ' || j.hora_fim::text)::timestamp at time zone e.timezone) as fim_janela
    from jornadas j
    cross join estabelecimento e
    cross join dia d
    where j.estabelecimento_id = p_estabelecimento_id
      and j.profissional_id = p_profissional_id
      and j.dia_semana = d.dia_semana
  ),
  candidatos as (
    select
      gs.inicio_candidato as inicio,
      gs.inicio_candidato + (s.duracao_minutos || ' minutes')::interval as fim
    from janelas jw
    cross join servico s
    cross join lateral generate_series(
      jw.inicio_janela,
      jw.fim_janela - (s.duracao_minutos || ' minutes')::interval,
      interval '15 minutes'
    ) as gs(inicio_candidato)
  )
  select c.inicio, c.fim
  from candidatos c
  cross join estabelecimento e
  where c.inicio >= now() + (e.antecedencia_horas || ' hours')::interval
    and not exists (
      select 1 from bloqueios bl
      where bl.estabelecimento_id = p_estabelecimento_id
        and (bl.profissional_id = p_profissional_id or bl.profissional_id is null)
        and tstzrange(bl.inicio, bl.fim) && tstzrange(c.inicio, c.fim)
    )
    and not exists (
      select 1 from agendamentos ag
      where ag.profissional_id = p_profissional_id
        and ag.status in ('pendente', 'confirmado')
        and tstzrange(ag.inicio, ag.fim) && tstzrange(c.inicio, c.fim)
    )
  order by c.inicio;
$$;

grant execute on function slots_disponiveis(uuid, uuid, uuid, date) to anon, authenticated;

-- Mesmo motivo do slots_disponiveis: p_barbearia_id -> p_estabelecimento_id exige DROP+CREATE.
drop function criar_agendamento_publico(uuid, uuid, uuid, timestamptz, text, text, text);

create function criar_agendamento_publico(
  p_estabelecimento_id uuid,
  p_profissional_id uuid,
  p_servico_id uuid,
  p_inicio timestamptz,
  p_nome text,
  p_telefone text,
  p_email text default null
) returns table (agendamento_id uuid, token_acesso uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_servico servicos;
  v_estabelecimento estabelecimentos;
  v_fim timestamptz;
  v_data_local date;
  v_cliente_id uuid;
  v_token uuid;
  v_agendamento_id uuid;
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

  return query select v_agendamento_id, v_token;
end;
$$;

grant execute on function criar_agendamento_publico(uuid, uuid, uuid, timestamptz, text, text, text) to anon, authenticated;

drop function agendamento_por_token(uuid);

create function agendamento_por_token(p_token uuid)
returns table (
  agendamento_id uuid,
  inicio timestamptz,
  fim timestamptz,
  status status_agendamento,
  preco_centavos int,
  servico_nome text,
  profissional_nome text,
  estabelecimento_nome text,
  estabelecimento_slug text,
  cliente_nome text
)
language sql stable security definer set search_path = public as $$
  select
    ag.id,
    ag.inicio,
    ag.fim,
    ag.status,
    ag.preco_centavos,
    s.nome,
    p.nome,
    e.nome,
    e.slug,
    c.nome
  from clientes c
  join agendamentos ag on ag.cliente_id = c.id
  join servicos s on s.id = ag.servico_id
  join profissionais p on p.id = ag.profissional_id
  join estabelecimentos e on e.id = c.estabelecimento_id
  where c.token_acesso = p_token
  order by ag.inicio desc;
$$;

grant execute on function agendamento_por_token(uuid) to anon, authenticated;

create or replace function cancelar_agendamento_via_token(p_token uuid, p_agendamento_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_cliente clientes;
  v_agendamento agendamentos;
  v_estabelecimento estabelecimentos;
  v_antecedencia_horas numeric;
begin
  select * into v_cliente from clientes where token_acesso = p_token;
  if not found then
    raise exception 'token invalido';
  end if;

  select * into v_agendamento
  from agendamentos
  where id = p_agendamento_id and cliente_id = v_cliente.id;
  if not found then
    raise exception 'agendamento nao encontrado';
  end if;

  if v_agendamento.status not in ('pendente', 'confirmado') then
    raise exception 'agendamento nao pode ser cancelado';
  end if;

  select * into v_estabelecimento from estabelecimentos where id = v_cliente.estabelecimento_id;
  v_antecedencia_horas := coalesce((v_estabelecimento.config->>'antecedencia_cancelamento_horas')::numeric, 2);

  if now() > v_agendamento.inicio - (v_antecedencia_horas || ' hours')::interval then
    raise exception 'fora do prazo permitido para cancelamento';
  end if;

  update agendamentos set status = 'cancelado' where id = p_agendamento_id;
end;
$$;
