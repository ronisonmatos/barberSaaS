-- Fase 1: RPC de disponibilidade (ORIENTACAO-BARBERSAAS.md secao 5.5).
-- Disponibilidade = jornada do dia - bloqueios - agendamentos (pendente/confirmado),
-- em passos de 15 min, respeitando duracao do servico, antecedencia minima e timezone da barbearia.

create or replace function slots_disponiveis(
  p_barbearia_id uuid,
  p_profissional_id uuid,
  p_servico_id uuid,
  p_data date
) returns table (inicio timestamptz, fim timestamptz)
language sql stable security definer set search_path = public as $$
  with barbearia as (
    select timezone, coalesce((config->>'antecedencia_min_horas')::numeric, 2) as antecedencia_horas
    from barbearias
    where id = p_barbearia_id
  ),
  servico as (
    select s.duracao_minutos
    from servicos s
    where s.id = p_servico_id
      and s.barbearia_id = p_barbearia_id
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
      ((p_data::text || ' ' || j.hora_inicio::text)::timestamp at time zone b.timezone) as inicio_janela,
      ((p_data::text || ' ' || j.hora_fim::text)::timestamp at time zone b.timezone) as fim_janela
    from jornadas j
    cross join barbearia b
    cross join dia d
    where j.barbearia_id = p_barbearia_id
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
  cross join barbearia b
  where c.inicio >= now() + (b.antecedencia_horas || ' hours')::interval
    and not exists (
      select 1 from bloqueios bl
      where bl.barbearia_id = p_barbearia_id
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
