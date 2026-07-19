-- Testes de verificacao do sistema de loja (produtos/pedidos).
-- Roda inteiro dentro de uma transacao que sempre da ROLLBACK.
-- Uso: supabase db query --linked -f supabase/tests/loja.sql

begin;

insert into estabelecimentos (id, nome, slug, timezone, status, plano_plataforma_id)
values
  ('50000000-0000-0000-0000-000000000001', 'Loja Teste Pro', 'loja-teste-pro', 'America/Sao_Paulo', 'ativa',
    (select id from planos_plataforma where nome = 'Pro')),
  ('50000000-0000-0000-0000-000000000002', 'Loja Teste Free', 'loja-teste-free', 'America/Sao_Paulo', 'ativa',
    (select id from planos_plataforma where nome = 'Free')),
  ('50000000-0000-0000-0000-000000000003', 'Loja Teste Trial', 'loja-teste-trial', 'America/Sao_Paulo', 'trial', null);

insert into produtos (id, estabelecimento_id, nome, slug, preco_centavos, estoque, ativo) values
  ('50000000-0000-0000-0000-000000000011', '50000000-0000-0000-0000-000000000001', 'Pomada', 'pomada-loja-teste', 3000, 5, true),
  ('50000000-0000-0000-0000-000000000012', '50000000-0000-0000-0000-000000000002', 'Oleo de barba', 'oleo-barba-loja-teste', 2000, 5, true);

-- ============================================================
-- Cenario 1: gate por plano
-- ============================================================
do $$
begin
  if not estabelecimento_permite_loja('50000000-0000-0000-0000-000000000001') then
    raise exception 'Pro deveria permitir loja';
  end if;
  if estabelecimento_permite_loja('50000000-0000-0000-0000-000000000002') then
    raise exception 'Free nao deveria permitir loja';
  end if;
  if not estabelecimento_permite_loja('50000000-0000-0000-0000-000000000003') then
    raise exception 'trial (sem plano) deveria permitir loja';
  end if;
  raise notice 'cenario 1 (gate por plano): OK';
end $$;

-- ============================================================
-- Cenario 2: compra avulsa (sem cobranca online) decrementa estoque
-- ============================================================
do $$
declare
  v_resultado record;
  v_estoque int;
begin
  select * into v_resultado from criar_pedido_publico(
    '50000000-0000-0000-0000-000000000001',
    jsonb_build_array(jsonb_build_object('produto_id', '50000000-0000-0000-0000-000000000011', 'quantidade', 2)),
    'Cliente Loja', '+5547999990001', null
  );

  if v_resultado.pedido_id is null then
    raise exception 'cenario 2: pedido deveria ter sido criado';
  end if;

  select estoque into v_estoque from produtos where id = '50000000-0000-0000-0000-000000000011';
  if v_estoque <> 3 then
    raise exception 'cenario 2: estoque deveria estar em 3, esta em %', v_estoque;
  end if;

  if (select status from pedidos where id = v_resultado.pedido_id) <> 'aguardando_retirada' then
    raise exception 'cenario 2: pedido sem cobranca deveria nascer aguardando_retirada';
  end if;

  if (select total_centavos from pedidos where id = v_resultado.pedido_id) <> 6000 then
    raise exception 'cenario 2: total deveria ser 6000 (2x3000)';
  end if;

  raise notice 'cenario 2 (compra avulsa decrementa estoque): OK';
end $$;

-- ============================================================
-- Cenario 3: estoque insuficiente bloqueia e nao altera nada
-- ============================================================
do $$
declare
  v_estoque_antes int;
  v_estoque_depois int;
begin
  select estoque into v_estoque_antes from produtos where id = '50000000-0000-0000-0000-000000000011';

  begin
    perform criar_pedido_publico(
      '50000000-0000-0000-0000-000000000001',
      jsonb_build_array(jsonb_build_object('produto_id', '50000000-0000-0000-0000-000000000011', 'quantidade', 999)),
      'Cliente Loja 2', '+5547999990002', null
    );
    raise exception 'cenario 3: deveria ter bloqueado por estoque insuficiente';
  exception
    when others then
      if sqlerrm <> 'produto indisponivel ou sem estoque suficiente' then
        raise exception 'cenario 3: esperava erro de estoque, veio: %', sqlerrm;
      end if;
  end;

  select estoque into v_estoque_depois from produtos where id = '50000000-0000-0000-0000-000000000011';
  if v_estoque_antes <> v_estoque_depois then
    raise exception 'cenario 3: estoque nao deveria ter mudado (antes=%, depois=%)', v_estoque_antes, v_estoque_depois;
  end if;

  raise notice 'cenario 3 (estoque insuficiente bloqueia sem efeitos colaterais): OK';
end $$;

-- ============================================================
-- Cenario 4: loja bloqueada no Free mesmo chamando a RPC direto
-- ============================================================
do $$
begin
  begin
    perform criar_pedido_publico(
      '50000000-0000-0000-0000-000000000002',
      jsonb_build_array(jsonb_build_object('produto_id', '50000000-0000-0000-0000-000000000012', 'quantidade', 1)),
      'Cliente Loja 3', '+5547999990003', null
    );
    raise exception 'cenario 4: deveria ter bloqueado (estabelecimento Free)';
  exception
    when others then
      if sqlerrm <> 'loja indisponivel para este estabelecimento' then
        raise exception 'cenario 4: esperava erro de loja bloqueada, veio: %', sqlerrm;
      end if;
  end;
  raise notice 'cenario 4 (loja bloqueada no Free): OK';
end $$;

-- ============================================================
-- Cenario 5: aplicar_limites_plano desativa todos os produtos no downgrade pra Free
-- (max_produtos=0) e reativa no upgrade pra Pro
-- ============================================================
do $$
begin
  update estabelecimentos set plano_plataforma_id = (select id from planos_plataforma where nome = 'Free')
  where id = '50000000-0000-0000-0000-000000000001';

  perform aplicar_limites_plano('50000000-0000-0000-0000-000000000001');

  if exists (select 1 from produtos where id = '50000000-0000-0000-0000-000000000011' and (ativo or not desativado_por_limite_plano)) then
    raise exception 'cenario 5: produto deveria estar desativado apos downgrade pra Free (max_produtos=0)';
  end if;

  update estabelecimentos set plano_plataforma_id = (select id from planos_plataforma where nome = 'Pro')
  where id = '50000000-0000-0000-0000-000000000001';

  perform aplicar_limites_plano('50000000-0000-0000-0000-000000000001');

  if exists (select 1 from produtos where id = '50000000-0000-0000-0000-000000000011' and (not ativo or desativado_por_limite_plano)) then
    raise exception 'cenario 5: produto deveria reativar automaticamente apos upgrade pra Pro';
  end if;

  raise notice 'cenario 5 (aplicar_limites_plano cobre produtos): OK';
end $$;

-- ============================================================
-- Cenario 6: compra combinada (servico + produto), um pagamento so
-- ============================================================
insert into profissionais (id, estabelecimento_id, nome, ativo)
values ('50000000-0000-0000-0000-000000000021', '50000000-0000-0000-0000-000000000001', 'Profissional Loja', true);

insert into servicos (id, estabelecimento_id, nome, duracao_minutos, preco_centavos, ativo)
values ('50000000-0000-0000-0000-000000000022', '50000000-0000-0000-0000-000000000001', 'Corte Teste', 30, 4000, true);

insert into profissional_servicos (profissional_id, servico_id)
values ('50000000-0000-0000-0000-000000000021', '50000000-0000-0000-0000-000000000022');

do $$
declare
  v_data date;
  v_dia_semana int;
begin
  v_data := current_date + interval '30 days';
  v_dia_semana := extract(dow from v_data)::int;
  insert into jornadas (estabelecimento_id, profissional_id, dia_semana, hora_inicio, hora_fim)
  values ('50000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000021', v_dia_semana, '09:00', '18:00');
end $$;

do $$
declare
  v_data date := current_date + interval '30 days';
  v_inicio timestamptz;
  v_resultado record;
  v_estoque int;
begin
  select min(inicio) into v_inicio
  from slots_disponiveis(
    '50000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000021',
    '50000000-0000-0000-0000-000000000022',
    v_data
  );

  if v_inicio is null then
    raise exception 'cenario 6: nao achou slot disponivel pra testar';
  end if;

  select * into v_resultado from criar_agendamento_publico(
    '50000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000021',
    '50000000-0000-0000-0000-000000000022',
    v_inicio,
    'Cliente Combo', '+5547999990004', null,
    jsonb_build_array(jsonb_build_object('produto_id', '50000000-0000-0000-0000-000000000011', 'quantidade', 1))
  );

  if v_resultado.agendamento_id is null or v_resultado.pedido_id is null then
    raise exception 'cenario 6: deveria retornar agendamento_id e pedido_id';
  end if;

  if (select agendamento_id from pedidos where id = v_resultado.pedido_id) <> v_resultado.agendamento_id then
    raise exception 'cenario 6: pedido deveria estar vinculado ao agendamento criado';
  end if;

  select estoque into v_estoque from produtos where id = '50000000-0000-0000-0000-000000000011';
  if v_estoque <> 2 then
    raise exception 'cenario 6: estoque deveria estar em 2 (3 - 1), esta em %', v_estoque;
  end if;

  raise notice 'cenario 6 (compra combinada vincula pedido ao agendamento): OK';
end $$;

rollback;
