-- Politica de agendamento configuravel por estabelecimento (config jsonb, mesmo padrao ja usado
-- por aparencia): antecedencia_min_horas (ja existia, sem UI), antecedencia_cancelamento_horas
-- (ja existia em cancelar_agendamento_via_token, mas como bloqueio duro com default 2h nunca
-- exposto ao dono) e antecedencia_remarcacao_horas (nova). Cancelamento fora do prazo deixa de
-- ser bloqueado -- agora e permitido e so marcado (cancelado_fora_do_prazo), pra decisao ficar
-- com o dono no botao "Reembolsar" (ja manual/owner-only). Remarcacao fora do prazo continua
-- bloqueada no self-service (sem cartao salvo, nao ha como cobrar uma taxa nova).

alter table agendamentos add column cancelado_fora_do_prazo boolean not null default false;

create or replace function cancelar_agendamento_via_token(p_token uuid, p_agendamento_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_cliente clientes;
  v_agendamento agendamentos;
  v_estabelecimento estabelecimentos;
  v_antecedencia_horas numeric;
  v_fora_do_prazo boolean;
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
  v_antecedencia_horas := coalesce((v_estabelecimento.config->>'antecedencia_cancelamento_horas')::numeric, 0);
  v_fora_do_prazo := now() > v_agendamento.inicio - (v_antecedencia_horas || ' hours')::interval;

  update agendamentos
  set status = 'cancelado', cancelado_fora_do_prazo = v_fora_do_prazo
  where id = p_agendamento_id;
end;
$$;

create or replace function remarcar_agendamento_via_token(p_token uuid, p_agendamento_id uuid, p_novo_inicio timestamptz)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_cliente clientes;
  v_agendamento agendamentos;
  v_estabelecimento estabelecimentos;
  v_servico servicos;
  v_prazo_horas numeric;
  v_novo_fim timestamptz;
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
    raise exception 'agendamento nao pode ser remarcado';
  end if;

  select * into v_estabelecimento from estabelecimentos where id = v_cliente.estabelecimento_id;
  v_prazo_horas := coalesce((v_estabelecimento.config->>'antecedencia_remarcacao_horas')::numeric, 0);

  if now() > v_agendamento.inicio - (v_prazo_horas || ' hours')::interval then
    raise exception 'fora do prazo permitido para remarcar';
  end if;

  select * into v_servico from servicos where id = v_agendamento.servico_id;
  v_novo_fim := p_novo_inicio + (v_servico.duracao_minutos || ' minutes')::interval;

  if not exists (
    select 1 from slots_disponiveis(v_estabelecimento.id, v_agendamento.profissional_id, v_agendamento.servico_id, p_novo_inicio::date)
    where inicio = p_novo_inicio
  ) then
    raise exception 'horario indisponivel';
  end if;

  update agendamentos set inicio = p_novo_inicio, fim = v_novo_fim where id = p_agendamento_id;
end;
$$;

grant execute on function remarcar_agendamento_via_token(uuid, uuid, timestamptz) to anon, authenticated;

-- agendamento_por_token precisa devolver profissional_id/servico_id/estabelecimento_id pra pagina
-- publica poder buscar slots livres e chamar remarcar_agendamento_via_token. So CREATE OR REPLACE
-- nao deixa mudar colunas de RETURNS TABLE (mesmo motivo ja documentado na leva do rename).
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
  cliente_nome text,
  profissional_id uuid,
  servico_id uuid,
  estabelecimento_id uuid
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
    c.nome,
    ag.profissional_id,
    ag.servico_id,
    e.id
  from clientes c
  join agendamentos ag on ag.cliente_id = c.id
  join servicos s on s.id = ag.servico_id
  join profissionais p on p.id = ag.profissional_id
  join estabelecimentos e on e.id = c.estabelecimento_id
  where c.token_acesso = p_token
  order by ag.inicio desc;
$$;

grant execute on function agendamento_por_token(uuid) to anon, authenticated;
