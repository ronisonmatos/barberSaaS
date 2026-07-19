-- Testes de verificacao do tema premium avulso (temas_plataforma / estabelecimento_temas_comprados).
-- Roda inteiro dentro de uma transacao que sempre da ROLLBACK.
-- Uso: supabase db query --linked -f supabase/tests/temas_plataforma.sql

begin;

insert into estabelecimentos (id, nome, slug, timezone, status)
values ('80000000-0000-0000-0000-000000000001', 'Estabelecimento Teste Temas', 'estabelecimento-teste-temas', 'America/Sao_Paulo', 'ativa');

-- ============================================================
-- Cenario 1: constraint XOR bloqueia linha com os dois FKs (ou nenhum) preenchidos
-- ============================================================
do $$
declare
  v_tema_id uuid;
  v_erro_capturado boolean := false;
begin
  select id into v_tema_id from temas_plataforma where chave = 'prestigio';
  if v_tema_id is null then
    raise exception 'FALHOU setup: tema prestigio nao encontrado (seed da migration)';
  end if;

  -- nenhum dos dois preenchido
  begin
    insert into pagamentos_plataforma (estabelecimento_id, valor_centavos, metodo)
    values ('80000000-0000-0000-0000-000000000001', 100, 'pix');
  exception when check_violation then
    v_erro_capturado := true;
  end;
  if not v_erro_capturado then
    raise exception 'FALHOU cenario 1a: deveria bloquear pagamento sem plano nem tema';
  end if;

  -- os dois preenchidos
  v_erro_capturado := false;
  begin
    insert into pagamentos_plataforma (estabelecimento_id, plano_plataforma_id, tema_plataforma_id, valor_centavos, metodo)
    values (
      '80000000-0000-0000-0000-000000000001',
      (select id from planos_plataforma where nome = 'Free'),
      v_tema_id,
      100,
      'pix'
    );
  exception when check_violation then
    v_erro_capturado := true;
  end;
  if not v_erro_capturado then
    raise exception 'FALHOU cenario 1b: deveria bloquear pagamento com plano E tema ao mesmo tempo';
  end if;

  raise notice 'OK cenario 1: constraint XOR de pagamentos_plataforma';
end $$;

-- ============================================================
-- Cenario 2: compra de tema grava em estabelecimento_temas_comprados
-- ============================================================
do $$
declare
  v_tema_id uuid;
  v_pagamento_id uuid;
  v_comprado boolean;
begin
  select id into v_tema_id from temas_plataforma where chave = 'prestigio';

  insert into pagamentos_plataforma (estabelecimento_id, tema_plataforma_id, valor_centavos, metodo, status)
  values ('80000000-0000-0000-0000-000000000001', v_tema_id, 14900, 'pix', 'pago')
  returning id into v_pagamento_id;

  insert into estabelecimento_temas_comprados (estabelecimento_id, tema_plataforma_id, pagamento_plataforma_id)
  values ('80000000-0000-0000-0000-000000000001', v_tema_id, v_pagamento_id);

  select exists (
    select 1 from estabelecimento_temas_comprados
    where estabelecimento_id = '80000000-0000-0000-0000-000000000001' and tema_plataforma_id = v_tema_id
  ) into v_comprado;

  if not v_comprado then
    raise exception 'FALHOU cenario 2: compra nao foi registrada';
  end if;
  raise notice 'OK cenario 2: compra de tema registrada';
end $$;

-- ============================================================
-- Cenario 3: unique impede comprar o mesmo tema 2x
-- ============================================================
do $$
declare
  v_tema_id uuid;
  v_erro_capturado boolean := false;
begin
  select id into v_tema_id from temas_plataforma where chave = 'prestigio';

  begin
    insert into estabelecimento_temas_comprados (estabelecimento_id, tema_plataforma_id)
    values ('80000000-0000-0000-0000-000000000001', v_tema_id);
  exception when unique_violation then
    v_erro_capturado := true;
  end;

  if not v_erro_capturado then
    raise exception 'FALHOU cenario 3: deveria bloquear comprar o mesmo tema duas vezes';
  end if;
  raise notice 'OK cenario 3: unique impede compra duplicada';
end $$;

do $$
begin
  raise notice '=== TODOS OS CENARIOS DE temas_plataforma PASSARAM ===';
end $$;

rollback;
