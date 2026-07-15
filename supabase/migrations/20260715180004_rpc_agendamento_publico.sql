-- Fase 1: RPC publica de criacao de agendamento (fluxo modo no_local, sem gate de pagamento).
-- security definer pois clientes/agendamentos nao tem escrita anonima direta (secao 5.4).

create or replace function criar_agendamento_publico(
  p_barbearia_id uuid,
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
  v_barbearia barbearias;
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

  select * into v_barbearia from barbearias where id = p_barbearia_id and status in ('ativa', 'trial');
  if not found then
    raise exception 'barbearia indisponivel';
  end if;

  select * into v_servico
  from servicos
  where id = p_servico_id and barbearia_id = p_barbearia_id and ativo
    and exists (
      select 1 from profissional_servicos ps
      where ps.servico_id = servicos.id and ps.profissional_id = p_profissional_id
    );
  if not found then
    raise exception 'servico indisponivel para este profissional';
  end if;

  v_fim := p_inicio + (v_servico.duracao_minutos || ' minutes')::interval;
  v_data_local := (p_inicio at time zone v_barbearia.timezone)::date;

  if not exists (
    select 1 from slots_disponiveis(p_barbearia_id, p_profissional_id, p_servico_id, v_data_local)
    where inicio = p_inicio
  ) then
    raise exception 'horario indisponivel';
  end if;

  insert into clientes (barbearia_id, nome, telefone, email)
  values (p_barbearia_id, trim(p_nome), p_telefone, p_email)
  on conflict (barbearia_id, telefone) do update
    set nome = excluded.nome,
        email = coalesce(excluded.email, clientes.email)
  returning id, token_acesso into v_cliente_id, v_token;

  begin
    insert into agendamentos (
      barbearia_id, cliente_id, profissional_id, servico_id,
      inicio, fim, status, origem, preco_centavos
    )
    values (
      p_barbearia_id, v_cliente_id, p_profissional_id, p_servico_id,
      p_inicio, v_fim, 'confirmado', 'online', v_servico.preco_centavos
    )
    returning id into v_agendamento_id;
  exception when exclusion_violation then
    raise exception 'horario acabou de ser reservado por outra pessoa, escolha outro horario';
  end;

  return query select v_agendamento_id, v_token;
end;
$$;

grant execute on function criar_agendamento_publico(uuid, uuid, uuid, timestamptz, text, text, text) to anon, authenticated;
