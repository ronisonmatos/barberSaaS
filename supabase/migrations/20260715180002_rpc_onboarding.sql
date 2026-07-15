-- Fase 1: RPC de onboarding. Cria a barbearia + o vinculo de owner na mesma transacao,
-- contornando o problema do ovo-e-a-galinha da policy de membros_barbearia
-- (minhas_barbearias() ainda estaria vazio para uma barbearia que nao existe).

create or replace function onboarding_criar_barbearia(p_nome text, p_slug text)
returns barbearias
language plpgsql security definer set search_path = public as $$
declare
  v_barbearia barbearias;
begin
  if auth.uid() is null then
    raise exception 'nao autenticado';
  end if;

  if exists (select 1 from membros_barbearia where usuario_id = auth.uid()) then
    raise exception 'usuario ja possui uma barbearia';
  end if;

  insert into barbearias (nome, slug, status, trial_ate, config)
  values (
    p_nome,
    p_slug,
    'trial',
    (current_date + interval '14 days')::date,
    '{"modo_cobranca_default": "no_local", "percentual_sinal": 30, "antecedencia_min_horas": 2}'
  )
  returning * into v_barbearia;

  insert into membros_barbearia (barbearia_id, usuario_id, papel)
  values (v_barbearia.id, auth.uid(), 'owner');

  return v_barbearia;
end;
$$;

grant execute on function onboarding_criar_barbearia(text, text) to authenticated;
