-- Fase 1: RPCs para a pagina de gerenciamento do cliente via token_acesso (secao 6.5).
-- clientes/agendamentos nao tem leitura/escrita anonima direta, entao o acesso passa
-- exclusivamente por estas RPCs security definer, validando o token explicitamente.

create or replace function agendamento_por_token(p_token uuid)
returns table (
  agendamento_id uuid,
  inicio timestamptz,
  fim timestamptz,
  status status_agendamento,
  preco_centavos int,
  servico_nome text,
  profissional_nome text,
  barbearia_nome text,
  barbearia_slug text,
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
    b.nome,
    b.slug,
    c.nome
  from clientes c
  join agendamentos ag on ag.cliente_id = c.id
  join servicos s on s.id = ag.servico_id
  join profissionais p on p.id = ag.profissional_id
  join barbearias b on b.id = c.barbearia_id
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
  v_barbearia barbearias;
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

  select * into v_barbearia from barbearias where id = v_cliente.barbearia_id;
  v_antecedencia_horas := coalesce((v_barbearia.config->>'antecedencia_cancelamento_horas')::numeric, 2);

  if now() > v_agendamento.inicio - (v_antecedencia_horas || ' hours')::interval then
    raise exception 'fora do prazo permitido para cancelamento';
  end if;

  update agendamentos set status = 'cancelado' where id = p_agendamento_id;
end;
$$;

grant execute on function cancelar_agendamento_via_token(uuid, uuid) to anon, authenticated;
