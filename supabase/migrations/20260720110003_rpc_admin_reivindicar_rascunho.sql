-- RPC para o super_admin vincular o convidado (ja criado em auth.users via inviteUserByEmail,
-- mesmo padrao de admin_criar_estabelecimento) como dono de um rascunho ja existente. Resolve a
-- reivindicacao sem precisar de rota de claim nova nem mudar o dispatcher "/": quando o convidado
-- definir senha, membros_estabelecimento ja existe e ele cai direto no /app.

create or replace function admin_reivindicar_rascunho(p_estabelecimento_id uuid, p_owner_id uuid)
returns estabelecimentos
language plpgsql security definer set search_path = public as $$
declare
  v_estabelecimento estabelecimentos;
begin
  if not eh_super_admin() then
    raise exception 'somente super_admin pode reivindicar pagina de demonstracao';
  end if;

  select * into v_estabelecimento from estabelecimentos where id = p_estabelecimento_id for update;
  if not found then
    raise exception 'estabelecimento nao encontrado';
  end if;
  if not v_estabelecimento.rascunho then
    raise exception 'este estabelecimento nao e uma pagina de demonstracao pendente';
  end if;
  if exists (select 1 from membros_estabelecimento where estabelecimento_id = p_estabelecimento_id) then
    raise exception 'este estabelecimento ja tem um dono vinculado';
  end if;

  insert into membros_estabelecimento (estabelecimento_id, usuario_id, papel, ativo)
  values (p_estabelecimento_id, p_owner_id, 'owner', true);

  update estabelecimentos
  set rascunho = false, rascunho_expira_em = null, trial_ate = (current_date + interval '14 days')::date
  where id = p_estabelecimento_id
  returning * into v_estabelecimento;

  return v_estabelecimento;
end;
$$;

grant execute on function admin_reivindicar_rascunho(uuid, uuid) to authenticated;
