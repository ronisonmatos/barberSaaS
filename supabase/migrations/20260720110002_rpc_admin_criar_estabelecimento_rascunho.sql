-- RPC para o super_admin criar uma pagina de demonstracao (rascunho sem dono), separada de
-- admin_criar_estabelecimento (que ja exige p_owner_id) para nao mexer numa RPC em producao.

create or replace function admin_criar_estabelecimento_rascunho(p_nome text, p_slug text)
returns estabelecimentos
language plpgsql security definer set search_path = public as $$
declare
  v_estabelecimento estabelecimentos;
begin
  if not eh_super_admin() then
    raise exception 'somente super_admin pode criar pagina de demonstracao';
  end if;

  insert into estabelecimentos (nome, slug, status, trial_ate, config, rascunho, rascunho_expira_em)
  values (
    p_nome,
    p_slug,
    'trial',
    null,
    '{"modo_cobranca_default": "no_local", "percentual_sinal": 30, "antecedencia_min_horas": 2}',
    true,
    now() + interval '7 days'
  )
  returning * into v_estabelecimento;

  return v_estabelecimento;
end;
$$;

grant execute on function admin_criar_estabelecimento_rascunho(text, text) to authenticated;
