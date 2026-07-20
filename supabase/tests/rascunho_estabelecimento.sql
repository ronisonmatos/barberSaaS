-- Testes de verificacao da pagina de demonstracao reivindicavel (rascunho de estabelecimento).
-- Roda inteiro dentro de uma transacao que sempre da ROLLBACK.
-- Uso: supabase db query --linked -f supabase/tests/rascunho_estabelecimento.sql
--
-- auth.uid() e simulado via set_config('request.jwt.claims', ...) (GUC local a transacao) --
-- e assim que eh_super_admin() identifica "quem esta chamando".

begin;

insert into auth.users (id, email) values
  ('70000000-0000-0000-0000-000000000001', 'super-admin-rascunho@exemplo.invalid'),
  ('70000000-0000-0000-0000-000000000002', 'usuario-comum-rascunho@exemplo.invalid'),
  ('70000000-0000-0000-0000-000000000003', 'convidado-rascunho@exemplo.invalid');

-- Promove o usuario 1 a super_admin sem passar por auth.uid() (jwt ainda nao setado nesse ponto
-- da transacao, entao eh_super_admin() e auth.role() sao NULL/false e o trigger de protecao de
-- papel nao bloqueia esse update direto, feito so pra montar a fixture).
update usuarios set papel = 'super_admin' where id = '70000000-0000-0000-0000-000000000001';

-- Estabelecimento normal (nao-rascunho), pra testar que a RPC de reivindicacao recusa alvos que
-- nao sao pagina de demonstracao.
insert into estabelecimentos (id, nome, slug, timezone, status, trial_ate)
values ('70000000-0000-0000-0000-000000000011', 'Estabelecimento Normal', 'teste-rascunho-normal', 'America/Sao_Paulo', 'ativa', null);

-- ============================================================
-- Cenario 1: so super_admin pode criar rascunho.
select set_config('request.jwt.claims', json_build_object('sub', '70000000-0000-0000-0000-000000000002')::text, true);

do $$
begin
  begin
    perform admin_criar_estabelecimento_rascunho('Demo Recusada', 'teste-rascunho-demo-recusada');
    raise exception 'usuario comum nao deveria conseguir criar pagina de demonstracao';
  exception
    when others then
      if sqlerrm <> 'somente super_admin pode criar pagina de demonstracao' then
        raise exception 'esperava erro de super_admin, veio: %', sqlerrm;
      end if;
  end;
  raise notice 'cenario 1 (so super_admin cria rascunho): OK';
end $$;

-- ============================================================
-- Cenario 2: super_admin cria o rascunho -- status trial, trial_ate null, sem dono.
select set_config('request.jwt.claims', json_build_object('sub', '70000000-0000-0000-0000-000000000001')::text, true);

do $$
declare
  v_estabelecimento estabelecimentos;
begin
  select * into v_estabelecimento from admin_criar_estabelecimento_rascunho('Demo Teste', 'teste-rascunho-demo');

  if v_estabelecimento.status <> 'trial' then
    raise exception 'rascunho deveria nascer com status trial, veio %', v_estabelecimento.status;
  end if;
  if v_estabelecimento.trial_ate is not null then
    raise exception 'rascunho deveria nascer com trial_ate null (fora do alcance do cron expirar-trial)';
  end if;
  if not v_estabelecimento.rascunho then
    raise exception 'rascunho deveria nascer com rascunho=true';
  end if;
  if v_estabelecimento.rascunho_expira_em is null or v_estabelecimento.rascunho_expira_em > now() + interval '8 days' then
    raise exception 'rascunho_expira_em deveria estar preenchido e proximo de 7 dias a frente';
  end if;
  if exists (select 1 from membros_estabelecimento where estabelecimento_id = v_estabelecimento.id) then
    raise exception 'rascunho recem-criado nao deveria ter nenhum membro';
  end if;

  -- Simula a condicao exata usada pelo cron expirar-trial (trial_ate < hoje): trial_ate null
  -- nunca casa, entao o rascunho fica fora do alcance sem precisar de filtro extra no cron.
  if exists (
    select 1 from estabelecimentos
    where id = v_estabelecimento.id and status = 'trial' and ativacao_manual = false
      and trial_ate < current_date
  ) then
    raise exception 'rascunho nao deveria cair no alcance do cron expirar-trial';
  end if;

  raise notice 'cenario 2 (super_admin cria rascunho corretamente): OK';
end $$;

-- ============================================================
-- Cenario 3: reivindicar por usuario comum deve falhar.
select set_config('request.jwt.claims', json_build_object('sub', '70000000-0000-0000-0000-000000000002')::text, true);

do $$
declare
  v_rascunho_id uuid;
begin
  select id into v_rascunho_id from estabelecimentos where slug = 'teste-rascunho-demo';

  begin
    perform admin_reivindicar_rascunho(v_rascunho_id, '70000000-0000-0000-0000-000000000003');
    raise exception 'usuario comum nao deveria conseguir reivindicar rascunho';
  exception
    when others then
      if sqlerrm <> 'somente super_admin pode reivindicar pagina de demonstracao' then
        raise exception 'esperava erro de super_admin, veio: %', sqlerrm;
      end if;
  end;
  raise notice 'cenario 3 (so super_admin reivindica): OK';
end $$;

-- ============================================================
-- Cenario 4: reivindicar um estabelecimento que nao e rascunho deve falhar.
select set_config('request.jwt.claims', json_build_object('sub', '70000000-0000-0000-0000-000000000001')::text, true);

do $$
begin
  begin
    perform admin_reivindicar_rascunho('70000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000003');
    raise exception 'nao deveria conseguir reivindicar um estabelecimento que nao e rascunho';
  exception
    when others then
      if sqlerrm <> 'este estabelecimento nao e uma pagina de demonstracao pendente' then
        raise exception 'esperava erro de "nao e rascunho", veio: %', sqlerrm;
      end if;
  end;
  raise notice 'cenario 4 (reivindicar nao-rascunho falha): OK';
end $$;

-- ============================================================
-- Cenario 5: reivindicacao bem sucedida -- vincula dono, desliga rascunho, comeca trial de verdade.
do $$
declare
  v_rascunho_id uuid;
  v_estabelecimento estabelecimentos;
  v_membro record;
begin
  select id into v_rascunho_id from estabelecimentos where slug = 'teste-rascunho-demo';

  select * into v_estabelecimento from admin_reivindicar_rascunho(v_rascunho_id, '70000000-0000-0000-0000-000000000003');

  if v_estabelecimento.rascunho then
    raise exception 'apos reivindicar, rascunho deveria virar false';
  end if;
  if v_estabelecimento.rascunho_expira_em is not null then
    raise exception 'apos reivindicar, rascunho_expira_em deveria virar null';
  end if;
  if v_estabelecimento.trial_ate is distinct from (current_date + interval '14 days')::date then
    raise exception 'apos reivindicar, trial_ate deveria comecar a contar 14 dias a partir de agora';
  end if;

  select * into v_membro from membros_estabelecimento
    where estabelecimento_id = v_rascunho_id and usuario_id = '70000000-0000-0000-0000-000000000003';
  if v_membro is null then
    raise exception 'reivindicacao deveria ter inserido o vinculo do novo dono';
  end if;
  if v_membro.papel <> 'owner' or not v_membro.ativo then
    raise exception 'novo dono deveria estar vinculado como owner ativo';
  end if;

  raise notice 'cenario 5 (reivindicacao vincula dono e desliga rascunho): OK';
end $$;

-- ============================================================
-- Cenario 6: reivindicar de novo (ja tem dono) deve falhar.
do $$
declare
  v_rascunho_id uuid;
begin
  select id into v_rascunho_id from estabelecimentos where slug = 'teste-rascunho-demo';

  begin
    perform admin_reivindicar_rascunho(v_rascunho_id, '70000000-0000-0000-0000-000000000002');
    raise exception 'nao deveria conseguir reivindicar um estabelecimento que ja tem dono';
  exception
    when others then
      if sqlerrm not in (
        'este estabelecimento ja tem um dono vinculado',
        'este estabelecimento nao e uma pagina de demonstracao pendente'
      ) then
        raise exception 'esperava erro de dono ja vinculado (ou rascunho ja desligado), veio: %', sqlerrm;
      end if;
  end;
  raise notice 'cenario 6 (reivindicar duas vezes falha): OK';
end $$;

-- ============================================================
-- Cenario 7: constraint de coerencia rascunho/rascunho_expira_em bloqueia estado inconsistente.
do $$
begin
  begin
    insert into estabelecimentos (nome, slug, timezone, status, trial_ate, rascunho, rascunho_expira_em)
    values ('Rascunho Inconsistente', 'teste-rascunho-inconsistente', 'America/Sao_Paulo', 'trial', null, true, null);
    raise exception 'constraint deveria ter bloqueado rascunho=true com rascunho_expira_em null';
  exception
    when others then
      if sqlerrm !~ 'rascunho_expira_em_coerente' then
        raise exception 'esperava erro da constraint rascunho_expira_em_coerente, veio: %', sqlerrm;
      end if;
  end;
  raise notice 'cenario 7 (constraint de coerencia bloqueia estado invalido): OK';
end $$;

-- ============================================================
-- Cenario 8: solicitar_ativacao_rascunho (self-service do cliente na pagina publica).
do $$
declare
  v_rascunho2 estabelecimentos;
begin
  select * into v_rascunho2 from admin_criar_estabelecimento_rascunho('Demo Ativacao', 'teste-rascunho-ativacao');

  -- Nao deveria funcionar num estabelecimento que nao e rascunho.
  begin
    perform solicitar_ativacao_rascunho('70000000-0000-0000-0000-000000000011', 'Cliente Teste', '+5547999990000');
    raise exception 'nao deveria aceitar solicitacao de ativacao num estabelecimento que nao e rascunho';
  exception
    when others then
      if sqlerrm <> 'estabelecimento nao encontrado ou nao e uma pagina de demonstracao' then
        raise exception 'esperava erro de "nao e rascunho", veio: %', sqlerrm;
      end if;
  end;

  perform solicitar_ativacao_rascunho(v_rascunho2.id, 'Cliente Interessado', '+5547999990000');
  if (select count(*) from notificacoes where estabelecimento_id = v_rascunho2.id and tipo = 'demo_ativacao_solicitada') <> 1 then
    raise exception 'deveria ter criado exatamente 1 notificacao';
  end if;
  if (select titulo from notificacoes where estabelecimento_id = v_rascunho2.id and tipo = 'demo_ativacao_solicitada') <> 'Cliente Interessado quer ativar a demonstração' then
    raise exception 'titulo da notificacao nao bate com o esperado';
  end if;

  -- Clique duplicado antes de alguem ler nao deveria duplicar a notificacao.
  perform solicitar_ativacao_rascunho(v_rascunho2.id, 'Cliente Interessado', '+5547999990000');
  if (select count(*) from notificacoes where estabelecimento_id = v_rascunho2.id and tipo = 'demo_ativacao_solicitada') <> 1 then
    raise exception 'clique duplicado nao deveria criar segunda notificacao enquanto a primeira nao foi lida';
  end if;

  -- Depois de marcada como lida, uma nova solicitacao pode gerar notificacao nova.
  update notificacoes set lida = true where estabelecimento_id = v_rascunho2.id and tipo = 'demo_ativacao_solicitada';
  perform solicitar_ativacao_rascunho(v_rascunho2.id, 'Cliente Interessado De Novo', '');
  if (select count(*) from notificacoes where estabelecimento_id = v_rascunho2.id and tipo = 'demo_ativacao_solicitada') <> 2 then
    raise exception 'apos a primeira ser lida, uma nova solicitacao deveria criar outra notificacao';
  end if;

  raise notice 'cenario 8 (solicitar_ativacao_rascunho cria/deduplica notificacoes): OK';
end $$;

rollback;
