-- Membro desativado (ver aplicar_limites_plano) perde acesso a TODA a RLS multi-tenant, nao so
-- ao painel: meus_estabelecimentos()/estabelecimentos_que_possuo() sao usadas por praticamente
-- toda policy de dominio.
create or replace function meus_estabelecimentos() returns setof uuid
language sql stable security definer set search_path = public as $$
  select estabelecimento_id from membros_estabelecimento where usuario_id = auth.uid() and ativo;
$$;

create or replace function estabelecimentos_que_possuo() returns setof uuid
language sql stable security definer set search_path = public as $$
  select estabelecimento_id from membros_estabelecimento
  where usuario_id = auth.uid() and papel = 'owner' and ativo;
$$;

-- Um membro desativado precisa continuar enxergando o proprio vinculo (pra getEstabelecimentoAtivo
-- redirecionar pra /conta-desativada em vez de /onboarding) mesmo que meus_estabelecimentos() -- que
-- agora exige ativo -- nao inclua mais o estabelecimento dele.
create policy "membros leem o proprio vinculo" on membros_estabelecimento for select
  using (usuario_id = auth.uid());

drop policy "publico ve fotos de estabelecimento ativo" on estabelecimento_fotos;

create policy "publico ve fotos de estabelecimento ativo" on estabelecimento_fotos for select
  to anon using (
    ativo and exists (
      select 1 from estabelecimentos e
      where e.id = estabelecimento_fotos.estabelecimento_id and e.status in ('ativa', 'trial')
    )
  );
