-- Check-in por QR Code: o cliente confirma a propria chegada no dia do agendamento
-- (informando o telefone usado no cadastro), sem depender do profissional fazer isso manualmente.
-- "Chegou" e um conceito separado de status: status ja significa "reserva confirmada/paga" (ver
-- criar_agendamento_publico e o webhook do Mercado Pago), entao usamos uma coluna propria.

alter table agendamentos add column chegou_em timestamptz;

-- Lista os agendamentos de HOJE (no timezone do estabelecimento) de um cliente, pelo telefone.
-- Publica (leitor do QR nao esta autenticado) mas escopada por estabelecimento+telefone.
create or replace function checkin_buscar_agendamentos_publico(
  p_estabelecimento_id uuid,
  p_telefone text
) returns table (
  agendamento_id uuid,
  inicio timestamptz,
  servico_nome text,
  profissional_nome text,
  ja_chegou boolean
)
language plpgsql security definer set search_path = public as $$
declare
  v_estabelecimento estabelecimentos;
  v_cliente_id uuid;
begin
  select * into v_estabelecimento from estabelecimentos
    where id = p_estabelecimento_id and status in ('ativa', 'trial');
  if not found then
    raise exception 'estabelecimento nao encontrado';
  end if;

  if p_telefone !~ '^\+[1-9]\d{7,14}$' then
    raise exception 'telefone invalido, use formato E.164';
  end if;

  select id into v_cliente_id from clientes
    where estabelecimento_id = p_estabelecimento_id and telefone = p_telefone;

  if v_cliente_id is null then
    return;
  end if;

  return query
    select a.id, a.inicio, s.nome, p.nome, (a.chegou_em is not null)
    from agendamentos a
    join servicos s on s.id = a.servico_id
    join profissionais p on p.id = a.profissional_id
    where a.estabelecimento_id = p_estabelecimento_id
      and a.cliente_id = v_cliente_id
      and a.status in ('pendente', 'confirmado')
      and (a.inicio at time zone v_estabelecimento.timezone)::date
        = (now() at time zone v_estabelecimento.timezone)::date
    order by a.inicio asc;
end;
$$;

grant execute on function checkin_buscar_agendamentos_publico(uuid, text) to anon, authenticated;

-- Confirma a chegada. Revalida telefone+estabelecimento+data contra o agendamento (defesa contra
-- adivinhar o agendamento_id, que sozinho nao basta pra confirmar).
create or replace function checkin_confirmar_publico(
  p_agendamento_id uuid,
  p_estabelecimento_id uuid,
  p_telefone text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_estabelecimento estabelecimentos;
  v_agendamento agendamentos;
  v_cliente_telefone text;
begin
  select * into v_estabelecimento from estabelecimentos
    where id = p_estabelecimento_id and status in ('ativa', 'trial');
  if not found then
    raise exception 'estabelecimento nao encontrado';
  end if;

  select a.* into v_agendamento from agendamentos a
    where a.id = p_agendamento_id and a.estabelecimento_id = p_estabelecimento_id;
  if not found then
    raise exception 'agendamento nao encontrado';
  end if;

  select telefone into v_cliente_telefone from clientes where id = v_agendamento.cliente_id;
  if v_cliente_telefone is distinct from p_telefone then
    raise exception 'telefone nao confere com o agendamento';
  end if;

  if v_agendamento.status not in ('pendente', 'confirmado') then
    raise exception 'agendamento nao esta mais ativo';
  end if;

  if (v_agendamento.inicio at time zone v_estabelecimento.timezone)::date
    <> (now() at time zone v_estabelecimento.timezone)::date then
    raise exception 'checkin so e permitido no dia do agendamento';
  end if;

  update agendamentos set chegou_em = coalesce(chegou_em, now()) where id = p_agendamento_id;
end;
$$;

grant execute on function checkin_confirmar_publico(uuid, uuid, text) to anon, authenticated;
