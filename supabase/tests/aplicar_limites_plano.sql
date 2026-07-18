-- Testes de verificacao da RPC aplicar_limites_plano.
-- Roda inteiro dentro de uma transacao que sempre da ROLLBACK: nunca persiste dados,
-- mesmo se um cenario falhar (RAISE EXCEPTION aborta a transacao).
-- Uso: supabase db query --linked -f supabase/tests/aplicar_limites_plano.sql

begin;

-- Fixtures sinteticas (nao usa nenhum usuario/estabelecimento real). O trigger handle_new_user
-- ja cria a linha correspondente em usuarios a partir do email.
insert into auth.users (id, email) values
  ('30000000-0000-0000-0000-000000000002', 'dono-teste-limites@exemplo.invalid'),
  ('30000000-0000-0000-0000-000000000003', 'staff-teste-limites-1@exemplo.invalid'),
  ('30000000-0000-0000-0000-000000000004', 'staff-teste-limites-2@exemplo.invalid');

insert into estabelecimentos (id, nome, slug, timezone, status, plano_plataforma_id)
values (
  '30000000-0000-0000-0000-000000000001',
  'Estabelecimento Teste Limites',
  'estabelecimento-teste-limites',
  'America/Sao_Paulo',
  'ativa',
  (select id from planos_plataforma where nome = 'Free')
);

insert into profissionais (id, estabelecimento_id, nome, ativo, created_at) values
  ('30000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000001', 'Prof 1 (mais antigo)', true, now() - interval '3 days'),
  ('30000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000001', 'Prof 2', true, now() - interval '2 days'),
  ('30000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000001', 'Prof 3 (mais novo)', true, now() - interval '1 days');

insert into membros_estabelecimento (id, estabelecimento_id, usuario_id, papel, ativo, created_at) values
  ('30000000-0000-0000-0000-000000000021', '30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'owner', true, now() - interval '3 days'),
  ('30000000-0000-0000-0000-000000000022', '30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'staff', true, now() - interval '2 days'),
  ('30000000-0000-0000-0000-000000000023', '30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'staff', true, now() - interval '1 days');

insert into estabelecimento_fotos (id, estabelecimento_id, url, ordem) values
  ('30000000-0000-0000-0000-000000000031', '30000000-0000-0000-0000-000000000001', 'https://exemplo/1.jpg', 0),
  ('30000000-0000-0000-0000-000000000032', '30000000-0000-0000-0000-000000000001', 'https://exemplo/2.jpg', 1),
  ('30000000-0000-0000-0000-000000000033', '30000000-0000-0000-0000-000000000001', 'https://exemplo/3.jpg', 2),
  ('30000000-0000-0000-0000-000000000034', '30000000-0000-0000-0000-000000000001', 'https://exemplo/4.jpg', 3),
  ('30000000-0000-0000-0000-000000000035', '30000000-0000-0000-0000-000000000001', 'https://exemplo/5.jpg', 4);

-- ============================================================
-- Cenario 1: aplica plano Free (1 profissional, 1 usuario, 3 fotos)
-- ============================================================
select aplicar_limites_plano('30000000-0000-0000-0000-000000000001');

do $$
begin
  if (select ativo from profissionais where id = '30000000-0000-0000-0000-000000000011') is not true then
    raise exception 'cenario 1: prof 1 (mais antigo) deveria continuar ativo';
  end if;
  if exists (select 1 from profissionais where id in ('30000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000013') and (ativo or not desativado_por_limite_plano)) then
    raise exception 'cenario 1: prof 2 e 3 deveriam estar desativados pelo limite do plano';
  end if;

  if (select ativo from membros_estabelecimento where id = '30000000-0000-0000-0000-000000000021') is not true then
    raise exception 'cenario 1: owner deveria continuar ativo';
  end if;
  if exists (select 1 from membros_estabelecimento where id in ('30000000-0000-0000-0000-000000000022', '30000000-0000-0000-0000-000000000023') and (ativo or not desativado_por_limite_plano)) then
    raise exception 'cenario 1: os 2 staff deveriam estar desativados (Free = so o dono conta como usuario)';
  end if;

  if exists (select 1 from estabelecimento_fotos where estabelecimento_id = '30000000-0000-0000-0000-000000000001' and ordem < 3 and not ativo) then
    raise exception 'cenario 1: as 3 fotos mais antigas deveriam continuar ativas';
  end if;
  if exists (select 1 from estabelecimento_fotos where estabelecimento_id = '30000000-0000-0000-0000-000000000001' and ordem >= 3 and (ativo or not desativado_por_limite_plano)) then
    raise exception 'cenario 1: as 2 fotos mais novas deveriam estar desativadas pelo limite do plano';
  end if;

  raise notice 'cenario 1 (downgrade para Free): OK';
end $$;

-- ============================================================
-- Cenario 2: dono desativa manualmente o profissional que estava ativo -- nao pode ser
-- reativado automaticamente depois, e o proximo da fila (prof 2) deve assumir a vaga.
-- ============================================================
update profissionais set ativo = false, desativado_por_limite_plano = false
where id = '30000000-0000-0000-0000-000000000011';

select aplicar_limites_plano('30000000-0000-0000-0000-000000000001');

do $$
begin
  if exists (select 1 from profissionais where id = '30000000-0000-0000-0000-000000000011' and (ativo or desativado_por_limite_plano)) then
    raise exception 'cenario 2: prof 1 desativado manualmente nao deveria ser mexido pela funcao';
  end if;
  if (select ativo from profissionais where id = '30000000-0000-0000-0000-000000000012') is not true then
    raise exception 'cenario 2: prof 2 deveria assumir a vaga (proximo mais antigo no pool)';
  end if;
  if exists (select 1 from profissionais where id = '30000000-0000-0000-0000-000000000013' and (ativo or not desativado_por_limite_plano)) then
    raise exception 'cenario 2: prof 3 deveria continuar desativado pelo limite do plano';
  end if;

  raise notice 'cenario 2 (protecao de desativacao manual): OK';
end $$;

-- ============================================================
-- Cenario 3: upgrade para Pro (ilimitado profissionais, 5 usuarios, 20 fotos) -- reativa tudo
-- que foi desativado PELO PLANO, mas nao mexe no que foi desativado manualmente.
-- ============================================================
update estabelecimentos set plano_plataforma_id = (select id from planos_plataforma where nome = 'Pro')
where id = '30000000-0000-0000-0000-000000000001';

select aplicar_limites_plano('30000000-0000-0000-0000-000000000001');

do $$
begin
  if exists (select 1 from profissionais where id = '30000000-0000-0000-0000-000000000011' and (ativo or desativado_por_limite_plano)) then
    raise exception 'cenario 3: prof 1 (desativado manualmente) nao deveria ser reativado pelo upgrade';
  end if;
  if exists (select 1 from profissionais where id in ('30000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000013') and (not ativo or desativado_por_limite_plano)) then
    raise exception 'cenario 3: prof 2 e 3 deveriam estar ativos (profissionais ilimitados no Pro)';
  end if;

  if exists (select 1 from membros_estabelecimento where estabelecimento_id = '30000000-0000-0000-0000-000000000001' and (not ativo or desativado_por_limite_plano)) then
    raise exception 'cenario 3: todos os membros deveriam estar ativos (Pro = 5 usuarios)';
  end if;

  if exists (select 1 from estabelecimento_fotos where estabelecimento_id = '30000000-0000-0000-0000-000000000001' and (not ativo or desativado_por_limite_plano)) then
    raise exception 'cenario 3: todas as fotos deveriam estar ativas (Pro = 20 fotos)';
  end if;

  raise notice 'cenario 3 (upgrade reativa pelo limite): OK';
end $$;

rollback;
