-- Testes de verificacao das RPCs publicas de leitura do cartao fidelidade
-- (cartoes_fidelidade_publico_por_telefone, cartao_fidelidade_por_token) e da notificacao
-- disparada em atualizar_status_agendamento quando um cartao completa.
-- Roda inteiro dentro de uma transacao que sempre da ROLLBACK.
-- Uso: supabase db query --linked -f supabase/tests/fidelidade_publico.sql

begin;

insert into auth.users (id, email) values
  ('61000000-0000-0000-0000-000000000001', 'owner-fidelidade-pub-a@exemplo.invalid');

insert into estabelecimentos (id, nome, slug, timezone, status, plano_plataforma_id)
values
  ('61000000-0000-0000-0000-000000000011', 'Fidelidade Pub Teste A', 'fidelidade-pub-teste-a', 'America/Sao_Paulo', 'ativa',
    (select id from planos_plataforma where nome = 'Pro')),
  ('61000000-0000-0000-0000-000000000012', 'Fidelidade Pub Teste B', 'fidelidade-pub-teste-b', 'America/Sao_Paulo', 'ativa',
    (select id from planos_plataforma where nome = 'Pro'));

insert into membros_estabelecimento (estabelecimento_id, usuario_id, papel, ativo) values
  ('61000000-0000-0000-0000-000000000011', '61000000-0000-0000-0000-000000000001', 'owner', true);

insert into profissionais (id, estabelecimento_id, nome, ativo) values
  ('61000000-0000-0000-0000-000000000021', '61000000-0000-0000-0000-000000000011', 'Prof A', true);

insert into servicos (id, estabelecimento_id, nome, duracao_minutos, preco_centavos, ativo) values
  ('61000000-0000-0000-0000-000000000031', '61000000-0000-0000-0000-000000000011', 'Corte A', 30, 4000, true);

insert into produtos (id, estabelecimento_id, nome, slug, preco_centavos, estoque, ativo) values
  ('61000000-0000-0000-0000-000000000041', '61000000-0000-0000-0000-000000000011', 'Pomada Brinde Pub', 'pomada-brinde-fidelidade-pub-teste', 3000, 5, true);

-- Mesmo telefone em dois estabelecimentos diferentes (linhas de clientes distintas) -- e o
-- cenario central do teste de isolamento.
insert into clientes (id, estabelecimento_id, nome, telefone) values
  ('61000000-0000-0000-0000-000000000051', '61000000-0000-0000-0000-000000000011', 'Cliente A1', '+5547999991001'),
  ('61000000-0000-0000-0000-000000000052', '61000000-0000-0000-0000-000000000012', 'Cliente B1 (mesmo telefone)', '+5547999991001');

insert into programas_fidelidade (id, estabelecimento_id, nome, servico_id, selos_necessarios, brinde_tipo, brinde_produto_id, ativo) values
  ('61000000-0000-0000-0000-000000000061', '61000000-0000-0000-0000-000000000011', 'Corte A x2', '61000000-0000-0000-0000-000000000031', 2, 'produto', '61000000-0000-0000-0000-000000000041', true);

insert into agendamentos (id, estabelecimento_id, cliente_id, profissional_id, servico_id, inicio, fim, status, preco_centavos) values
  ('61000000-0000-0000-0000-000000000071', '61000000-0000-0000-0000-000000000011', '61000000-0000-0000-0000-000000000051', '61000000-0000-0000-0000-000000000021', '61000000-0000-0000-0000-000000000031', now() + interval '10 days', now() + interval '10 days 30 minutes', 'confirmado', 4000),
  ('61000000-0000-0000-0000-000000000072', '61000000-0000-0000-0000-000000000011', '61000000-0000-0000-0000-000000000051', '61000000-0000-0000-0000-000000000021', '61000000-0000-0000-0000-000000000031', now() + interval '11 days', now() + interval '11 days 30 minutes', 'confirmado', 4000);

select set_config('request.jwt.claims', json_build_object('sub', '61000000-0000-0000-0000-000000000001')::text, true);

-- ============================================================
-- Cenario 1: telefone inexistente retorna vazio
-- ============================================================
do $$
declare v_qtd int;
begin
  select count(*) into v_qtd from cartoes_fidelidade_publico_por_telefone('61000000-0000-0000-0000-000000000011', '+5547999999999');
  if v_qtd <> 0 then
    raise exception 'cenario 1: telefone inexistente deveria retornar vazio, veio %', v_qtd;
  end if;
  raise notice 'cenario 1 (telefone inexistente retorna vazio): OK';
end $$;

-- ============================================================
-- Cenario 2: cliente existente mas sem cartao ainda tambem retorna vazio
-- ============================================================
do $$
declare v_qtd int;
begin
  select count(*) into v_qtd from cartoes_fidelidade_publico_por_telefone('61000000-0000-0000-0000-000000000012', '+5547999991001');
  if v_qtd <> 0 then
    raise exception 'cenario 2: cliente sem cartao deveria retornar vazio, veio %', v_qtd;
  end if;
  raise notice 'cenario 2 (cliente sem cartao retorna vazio): OK';
end $$;

-- ============================================================
-- Cenario 2.5: cliente ja agendou o servico (ainda 'confirmado', nao concluido) mas nunca teve
-- selo -- RPC deve mostrar progresso "0 de N" (participacao automatica), sem cartao_id.
-- ============================================================
do $$
declare
  v_cartao_id uuid;
  v_selos_atual int;
  v_selos_necessarios int;
  v_status text;
begin
  select cartao_id, selos_atual, selos_necessarios, status
    into v_cartao_id, v_selos_atual, v_selos_necessarios, v_status
  from cartoes_fidelidade_publico_por_telefone('61000000-0000-0000-0000-000000000011', '+5547999991001');

  if v_cartao_id is not null then
    raise exception 'cenario 2.5: entrada virtual nao deveria ter cartao_id, veio %', v_cartao_id;
  end if;
  if v_selos_atual <> 0 or v_selos_necessarios <> 2 or v_status <> 'em_andamento' then
    raise exception 'cenario 2.5: esperava 0/2 em_andamento, veio %/%/%', v_selos_atual, v_selos_necessarios, v_status;
  end if;

  raise notice 'cenario 2.5 (progresso 0/N antes da primeira conclusao): OK';
end $$;

-- ============================================================
-- Cenario 3: completar o cartao (2 selos) via atualizar_status_agendamento, depois ler pelas
-- duas RPCs publicas (telefone e token) e conferir status/brinde/notificacao
-- ============================================================
do $$
declare
  v_status text;
  v_brinde text;
  v_selos_atual int;
  v_qtd_notif_antes int;
  v_qtd_notif_depois int;
begin
  select count(*) into v_qtd_notif_antes from notificacoes where estabelecimento_id = '61000000-0000-0000-0000-000000000011';

  perform atualizar_status_agendamento('61000000-0000-0000-0000-000000000071', 'concluido');
  perform atualizar_status_agendamento('61000000-0000-0000-0000-000000000072', 'concluido');

  select status, brinde, selos_atual into v_status, v_brinde, v_selos_atual
  from cartoes_fidelidade_publico_por_telefone('61000000-0000-0000-0000-000000000011', '+5547999991001');

  if v_status <> 'completo' or v_brinde <> 'Pomada Brinde Pub' or v_selos_atual <> 2 then
    raise exception 'cenario 3: esperava completo/Pomada Brinde Pub/2, veio %/%/%', v_status, v_brinde, v_selos_atual;
  end if;

  select count(*) into v_qtd_notif_depois from notificacoes where estabelecimento_id = '61000000-0000-0000-0000-000000000011';
  if v_qtd_notif_depois <> v_qtd_notif_antes + 1 then
    raise exception 'cenario 3: esperava exatamente 1 notificacao nova, veio % (antes %, depois %)', v_qtd_notif_depois - v_qtd_notif_antes, v_qtd_notif_antes, v_qtd_notif_depois;
  end if;
  if not exists (select 1 from notificacoes where estabelecimento_id = '61000000-0000-0000-0000-000000000011' and tipo = 'fidelidade_completo' order by created_at desc limit 1) then
    raise exception 'cenario 3: notificacao deveria ter tipo fidelidade_completo';
  end if;

  raise notice 'cenario 3 (completar cartao gera notificacao e RPC por telefone reflete status): OK';
end $$;

-- ============================================================
-- Cenario 4: RPC por token retorna o mesmo cartao
-- ============================================================
do $$
declare
  v_token uuid;
  v_status text;
begin
  select token_acesso into v_token from clientes where id = '61000000-0000-0000-0000-000000000051';

  select status into v_status from cartao_fidelidade_por_token(v_token);
  if v_status <> 'completo' then
    raise exception 'cenario 4: RPC por token deveria retornar cartao completo, veio %', v_status;
  end if;

  raise notice 'cenario 4 (RPC por token reflete o mesmo cartao): OK';
end $$;

-- ============================================================
-- Cenario 5: isolamento -- mesmo telefone em estabelecimento B nao enxerga o cartao de A
-- ============================================================
do $$
declare v_qtd int;
begin
  select count(*) into v_qtd from cartoes_fidelidade_publico_por_telefone('61000000-0000-0000-0000-000000000012', '+5547999991001');
  if v_qtd <> 0 then
    raise exception 'cenario 5: cliente do estabelecimento B nao deveria ver o cartao de A, veio %', v_qtd;
  end if;
  raise notice 'cenario 5 (isolamento entre estabelecimentos com mesmo telefone): OK';
end $$;

-- ============================================================
-- Cenario 6: repetir a mesma transicao (idempotente) nao gera notificacao duplicada
-- ============================================================
do $$
declare v_qtd_antes int; v_qtd_depois int;
begin
  select count(*) into v_qtd_antes from notificacoes where estabelecimento_id = '61000000-0000-0000-0000-000000000011';
  perform atualizar_status_agendamento('61000000-0000-0000-0000-000000000072', 'concluido'); -- ja esta concluido, no-op
  select count(*) into v_qtd_depois from notificacoes where estabelecimento_id = '61000000-0000-0000-0000-000000000011';
  if v_qtd_depois <> v_qtd_antes then
    raise exception 'cenario 6: repetir a mesma transicao nao deveria gerar notificacao nova (antes %, depois %)', v_qtd_antes, v_qtd_depois;
  end if;
  raise notice 'cenario 6 (idempotencia nao duplica notificacao): OK';
end $$;

rollback;
