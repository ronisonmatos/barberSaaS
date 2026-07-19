-- Testes de verificacao do cartao fidelidade (concessao/revogacao de selo via
-- atualizar_status_agendamento, resgate via resgatar_cartao_fidelidade).
-- Roda inteiro dentro de uma transacao que sempre da ROLLBACK.
-- Uso: supabase db query --linked -f supabase/tests/cartao_fidelidade.sql
--
-- auth.uid() e simulado via set_config('request.jwt.claims', ...) (GUC local a transacao) --
-- e assim que a RPC identifica "quem esta chamando" pra checar meus_estabelecimentos().

begin;

insert into auth.users (id, email) values
  ('60000000-0000-0000-0000-000000000001', 'owner-fidelidade-a@exemplo.invalid'),
  ('60000000-0000-0000-0000-000000000002', 'owner-fidelidade-b@exemplo.invalid');

insert into estabelecimentos (id, nome, slug, timezone, status, plano_plataforma_id)
values
  ('60000000-0000-0000-0000-000000000011', 'Fidelidade Teste Pro', 'fidelidade-teste-pro', 'America/Sao_Paulo', 'ativa',
    (select id from planos_plataforma where nome = 'Pro')),
  ('60000000-0000-0000-0000-000000000012', 'Fidelidade Teste Free', 'fidelidade-teste-free', 'America/Sao_Paulo', 'ativa',
    (select id from planos_plataforma where nome = 'Free'));

insert into membros_estabelecimento (estabelecimento_id, usuario_id, papel, ativo) values
  ('60000000-0000-0000-0000-000000000011', '60000000-0000-0000-0000-000000000001', 'owner', true),
  ('60000000-0000-0000-0000-000000000012', '60000000-0000-0000-0000-000000000002', 'owner', true);

insert into profissionais (id, estabelecimento_id, nome, ativo) values
  ('60000000-0000-0000-0000-000000000021', '60000000-0000-0000-0000-000000000011', 'Prof A', true),
  ('60000000-0000-0000-0000-000000000022', '60000000-0000-0000-0000-000000000012', 'Prof B', true);

insert into servicos (id, estabelecimento_id, nome, duracao_minutos, preco_centavos, ativo) values
  ('60000000-0000-0000-0000-000000000031', '60000000-0000-0000-0000-000000000011', 'Corte A', 30, 4000, true),
  ('60000000-0000-0000-0000-000000000032', '60000000-0000-0000-0000-000000000012', 'Corte B', 30, 4000, true);

insert into produtos (id, estabelecimento_id, nome, slug, preco_centavos, estoque, ativo) values
  ('60000000-0000-0000-0000-000000000041', '60000000-0000-0000-0000-000000000011', 'Pomada Brinde', 'pomada-brinde-fidelidade-teste', 3000, 5, true);

insert into clientes (id, estabelecimento_id, nome, telefone) values
  ('60000000-0000-0000-0000-000000000051', '60000000-0000-0000-0000-000000000011', 'Cliente A', '+5547999990001'),
  ('60000000-0000-0000-0000-000000000052', '60000000-0000-0000-0000-000000000012', 'Cliente B', '+5547999990002');

-- Programa: 3 selos no "Corte A" completam um Pomada Brinde de graca.
insert into programas_fidelidade (id, estabelecimento_id, nome, servico_id, selos_necessarios, brinde_tipo, brinde_produto_id, ativo) values
  ('60000000-0000-0000-0000-000000000061', '60000000-0000-0000-0000-000000000011', 'Corte A x10', '60000000-0000-0000-0000-000000000031', 3, 'produto', '60000000-0000-0000-0000-000000000041', true);

-- Mesmo desenho de programa no estabelecimento Free -- existe, mas o gate por plano deve
-- impedir concessao de selo (cenario 6).
insert into programas_fidelidade (id, estabelecimento_id, nome, servico_id, selos_necessarios, brinde_tipo, brinde_servico_id, ativo) values
  ('60000000-0000-0000-0000-000000000062', '60000000-0000-0000-0000-000000000012', 'Corte B x2', '60000000-0000-0000-0000-000000000032', 2, 'servico', '60000000-0000-0000-0000-000000000032', true);

-- Agendamentos de A (confirmados, prontos pra concluir), horarios distintos.
insert into agendamentos (id, estabelecimento_id, cliente_id, profissional_id, servico_id, inicio, fim, status, preco_centavos) values
  ('60000000-0000-0000-0000-000000000071', '60000000-0000-0000-0000-000000000011', '60000000-0000-0000-0000-000000000051', '60000000-0000-0000-0000-000000000021', '60000000-0000-0000-0000-000000000031', now() + interval '10 days', now() + interval '10 days 30 minutes', 'confirmado', 4000),
  ('60000000-0000-0000-0000-000000000072', '60000000-0000-0000-0000-000000000011', '60000000-0000-0000-0000-000000000051', '60000000-0000-0000-0000-000000000021', '60000000-0000-0000-0000-000000000031', now() + interval '11 days', now() + interval '11 days 30 minutes', 'confirmado', 4000),
  ('60000000-0000-0000-0000-000000000073', '60000000-0000-0000-0000-000000000011', '60000000-0000-0000-0000-000000000051', '60000000-0000-0000-0000-000000000021', '60000000-0000-0000-0000-000000000031', now() + interval '12 days', now() + interval '12 days 30 minutes', 'confirmado', 4000),
  ('60000000-0000-0000-0000-000000000074', '60000000-0000-0000-0000-000000000011', '60000000-0000-0000-0000-000000000051', '60000000-0000-0000-0000-000000000021', '60000000-0000-0000-0000-000000000031', now() + interval '13 days', now() + interval '13 days 30 minutes', 'confirmado', 4000);

-- Agendamento de B (plano Free).
insert into agendamentos (id, estabelecimento_id, cliente_id, profissional_id, servico_id, inicio, fim, status, preco_centavos) values
  ('60000000-0000-0000-0000-000000000081', '60000000-0000-0000-0000-000000000012', '60000000-0000-0000-0000-000000000052', '60000000-0000-0000-0000-000000000022', '60000000-0000-0000-0000-000000000032', now() + interval '10 days', now() + interval '10 days 30 minutes', 'confirmado', 4000);

-- Simula auth.uid() = owner de A pro resto dos cenarios, exceto onde indicado.
select set_config('request.jwt.claims', json_build_object('sub', '60000000-0000-0000-0000-000000000001')::text, true);

-- ============================================================
-- Cenario 1: concessao de selo so em 'concluido'
-- ============================================================
do $$
declare
  v_cartao record;
begin
  perform atualizar_status_agendamento('60000000-0000-0000-0000-000000000071', 'concluido');

  select * into v_cartao from cartoes_fidelidade
    where cliente_id = '60000000-0000-0000-0000-000000000051' and programa_id = '60000000-0000-0000-0000-000000000061';
  if not found then
    raise exception 'cenario 1: cartao deveria ter sido criado ao concluir o agendamento';
  end if;
  if v_cartao.selos_atual <> 1 or v_cartao.status <> 'em_andamento' then
    raise exception 'cenario 1: esperava selos_atual=1, status=em_andamento; veio selos_atual=%, status=%', v_cartao.selos_atual, v_cartao.status;
  end if;

  raise notice 'cenario 1 (concessao de selo em concluido): OK';
end $$;

-- ============================================================
-- Cenario 2: idempotencia -- repetir a mesma transicao (no-op) nao duplica selo
-- ============================================================
do $$
declare
  v_selos_atual int;
begin
  perform atualizar_status_agendamento('60000000-0000-0000-0000-000000000071', 'concluido');

  select selos_atual into v_selos_atual from cartoes_fidelidade
    where cliente_id = '60000000-0000-0000-0000-000000000051' and programa_id = '60000000-0000-0000-0000-000000000061';
  if v_selos_atual <> 1 then
    raise exception 'cenario 2: repetir a mesma transicao nao deveria duplicar selo, selos_atual=%', v_selos_atual;
  end if;
  if (select count(*) from fidelidade_selos where agendamento_id = '60000000-0000-0000-0000-000000000071') <> 1 then
    raise exception 'cenario 2: deveria haver so 1 linha de selo pro agendamento 71';
  end if;

  raise notice 'cenario 2 (idempotencia): OK';
end $$;

-- ============================================================
-- Cenario 3: revogacao ao corrigir status pra fora de 'concluido'
-- ============================================================
do $$
declare
  v_selos_atual int;
begin
  perform atualizar_status_agendamento('60000000-0000-0000-0000-000000000071', 'no_show');

  select selos_atual into v_selos_atual from cartoes_fidelidade
    where cliente_id = '60000000-0000-0000-0000-000000000051' and programa_id = '60000000-0000-0000-0000-000000000061';
  if v_selos_atual <> 0 then
    raise exception 'cenario 3: selo deveria ter sido revogado, selos_atual=%', v_selos_atual;
  end if;
  if exists (select 1 from fidelidade_selos where agendamento_id = '60000000-0000-0000-0000-000000000071') then
    raise exception 'cenario 3: linha de selo deveria ter sido removida';
  end if;

  raise notice 'cenario 3 (revogacao de selo): OK';
end $$;

-- ============================================================
-- Cenario 4: cartao completa exatamente no N-esimo selo (selos_necessarios=3)
-- ============================================================
do $$
declare
  v_cartao record;
begin
  -- Re-concluir o 71 (selo 1), depois 72 (selo 2), depois 73 (selo 3 -> completo).
  perform atualizar_status_agendamento('60000000-0000-0000-0000-000000000071', 'concluido');
  perform atualizar_status_agendamento('60000000-0000-0000-0000-000000000072', 'concluido');

  select * into v_cartao from cartoes_fidelidade
    where cliente_id = '60000000-0000-0000-0000-000000000051' and programa_id = '60000000-0000-0000-0000-000000000061';
  if v_cartao.selos_atual <> 2 or v_cartao.status <> 'em_andamento' then
    raise exception 'cenario 4: apos 2 selos deveria continuar em_andamento, veio selos_atual=%, status=%', v_cartao.selos_atual, v_cartao.status;
  end if;

  perform atualizar_status_agendamento('60000000-0000-0000-0000-000000000073', 'concluido');

  select * into v_cartao from cartoes_fidelidade
    where cliente_id = '60000000-0000-0000-0000-000000000051' and programa_id = '60000000-0000-0000-0000-000000000061';
  if v_cartao.selos_atual <> 3 or v_cartao.status <> 'completo' or v_cartao.completado_em is null then
    raise exception 'cenario 4: com 3 selos deveria estar completo, veio selos_atual=%, status=%', v_cartao.selos_atual, v_cartao.status;
  end if;

  raise notice 'cenario 4 (completa no N-esimo selo): OK';
end $$;

-- ============================================================
-- Cenario 5: resgate -- so funciona com cartao completo, e nao pode resgatar 2x
-- ============================================================
do $$
declare
  v_cartao_id uuid := (select id from cartoes_fidelidade where cliente_id = '60000000-0000-0000-0000-000000000051' and programa_id = '60000000-0000-0000-0000-000000000061');
begin
  perform resgatar_cartao_fidelidade(v_cartao_id);

  if (select status from cartoes_fidelidade where id = v_cartao_id) <> 'resgatado' then
    raise exception 'cenario 5: cartao deveria estar resgatado';
  end if;

  begin
    perform resgatar_cartao_fidelidade(v_cartao_id);
    raise exception 'cenario 5: nao deveria permitir resgatar duas vezes';
  exception
    when others then
      if sqlerrm <> 'cartao ainda nao esta completo' then
        raise exception 'cenario 5: esperava erro de cartao ja resgatado, veio: %', sqlerrm;
      end if;
  end;

  raise notice 'cenario 5 (resgate unico): OK';
end $$;

-- ============================================================
-- Cenario 6: bloqueia reverter status de um agendamento cujo selo esta num cartao ja resgatado
-- ============================================================
do $$
begin
  begin
    perform atualizar_status_agendamento('60000000-0000-0000-0000-000000000073', 'no_show');
    raise exception 'cenario 6: deveria ter bloqueado a reversao (cartao ja resgatado)';
  exception
    when others then
      if sqlerrm !~ 'ja resgatado' then
        raise exception 'cenario 6: esperava erro de cartao ja resgatado, veio: %', sqlerrm;
      end if;
  end;

  if (select status from agendamentos where id = '60000000-0000-0000-0000-000000000073') <> 'concluido' then
    raise exception 'cenario 6: status do agendamento nao deveria ter mudado (rollback da funcao inteira)';
  end if;

  raise notice 'cenario 6 (bloqueio de reversao pos-resgate): OK';
end $$;

-- ============================================================
-- Cenario 7: gate por plano -- Free nao concede selo (mas o "Concluir" nao falha)
-- ============================================================
do $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', '60000000-0000-0000-0000-000000000002')::text, true);
  perform atualizar_status_agendamento('60000000-0000-0000-0000-000000000081', 'concluido');

  if (select status from agendamentos where id = '60000000-0000-0000-0000-000000000081') <> 'concluido' then
    raise exception 'cenario 7: agendamento deveria ter sido concluido mesmo sem conceder selo';
  end if;
  if exists (select 1 from cartoes_fidelidade where cliente_id = '60000000-0000-0000-0000-000000000052') then
    raise exception 'cenario 7: nao deveria ter criado cartao no plano Free';
  end if;

  raise notice 'cenario 7 (gate por plano nao concede selo): OK';
end $$;

-- ============================================================
-- Cenario 8: isolamento entre estabelecimentos
-- ============================================================
do $$
declare
  v_cartao_id uuid := (select id from cartoes_fidelidade where cliente_id = '60000000-0000-0000-0000-000000000051' and programa_id = '60000000-0000-0000-0000-000000000061');
begin
  -- ainda simulando auth.uid() = owner de B (Free), tentando mexer em dados de A (Pro).
  begin
    perform atualizar_status_agendamento('60000000-0000-0000-0000-000000000074', 'concluido');
    raise exception 'cenario 8: owner de B nao deveria conseguir mudar status de agendamento de A';
  exception
    when others then
      if sqlerrm <> 'agendamento nao encontrado ou sem permissao' then
        raise exception 'cenario 8: esperava erro de permissao (status), veio: %', sqlerrm;
      end if;
  end;

  begin
    perform resgatar_cartao_fidelidade(v_cartao_id);
    raise exception 'cenario 8: owner de B nao deveria conseguir resgatar cartao de A';
  exception
    when others then
      if sqlerrm <> 'cartao nao encontrado ou sem permissao' then
        raise exception 'cenario 8: esperava erro de permissao (resgate), veio: %', sqlerrm;
      end if;
  end;

  raise notice 'cenario 8 (isolamento entre estabelecimentos): OK';
end $$;

rollback;
