-- RPC para o cadastro manual de estabelecimento pelo super_admin (dono ja definido,
-- diferente de onboarding_criar_estabelecimento que usa auth.uid() como dono).

create or replace function admin_criar_estabelecimento(p_nome text, p_slug text, p_owner_id uuid)
returns estabelecimentos
language plpgsql security definer set search_path = public as $$
declare
  v_estabelecimento estabelecimentos;
begin
  if not eh_super_admin() then
    raise exception 'somente super_admin pode cadastrar estabelecimento manualmente';
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
  values (v_estabelecimento.id, p_owner_id, 'owner');

  return v_estabelecimento;
end;
$$;

grant execute on function admin_criar_estabelecimento(text, text, uuid) to authenticated;
