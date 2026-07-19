-- Testes de verificacao do clube de assinatura do cliente final.
-- Roda inteiro dentro de uma transacao que sempre da ROLLBACK.
-- Uso: supabase db query --linked -f supabase/tests/clube_assinatura.sql
--
-- Nenhuma RPC aqui depende de auth.uid() (todas sao publicas, resolvem identidade por telefone),
-- entao nao precisa simular JWT como nos testes de fidelidade.

begin;

insert into estabelecimentos (id, nome, slug, timezone, status, plano_plataforma_id)
values
  ('70000000-0000-0000-0000-000000000011', 'Clube Teste Pro', 'clube-teste-pro', 'America/Sao_Paulo', 'ativa',
    (select id from planos_plataforma where nome = 'Pro')),
  ('70000000-0000-0000-0000-000000000012', 'Clube Teste Free', 'clube-teste-free', 'America/Sao_Paulo', 'ativa',
    (select id from planos_plataforma where nome = 'Free'));

insert into estabelecimento_pagamento_config (estabelecimento_id, gateway_ativo, mercado_pago_access_token, aceita_pagamento_antecipado, aceita_pagamento_no_dia)
values ('70000000-0000-0000-0000-000000000011', 'mercado_pago', 'TEST-token-fake', true, true);

insert into profissionais (id, estabelecimento_id, nome, ativo) values
  ('70000000-0000-0000-0000-000000000021', '70000000-0000-0000-0000-000000000011', 'Prof Clube', true);

insert into servicos (id, estabelecimento_id, nome, duracao_minutos, preco_centavos, ativo) values
  ('70000000-0000-0000-0000-000000000031', '70000000-0000-0000-0000-000000000011', 'Corte Clube', 30, 5000, true);

insert into profissional_servicos (profissional_id, servico_id) values
  ('70000000-0000-0000-0000-000000000021', '70000000-0000-0000-0000-000000000031');

do $$
declare
  v_data date := current_date + interval '30 days';
  v_dia_semana int := extract(dow from (current_date + interval '30 days'))::int;
begin
  insert into jornadas (estabelecimento_id, profissional_id, dia_semana, hora_inicio, hora_fim)
  values ('70000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000021', v_dia_semana, '09:00', '18:00');
end $$;

insert into planos_estabelecimento (id, estabelecimento_id, nome, preco_centavos, ativo, regras) values
  ('70000000-0000-0000-0000-000000000041', '70000000-0000-0000-0000-000000000011', 'Clube do Corte', 8000, true,
    jsonb_build_array(jsonb_build_object('servico_id', '70000000-0000-0000-0000-000000000031', 'quantidade_mes', 2))),
  ('70000000-0000-0000-0000-000000000042', '70000000-0000-0000-0000-000000000012', 'Clube Free', 5000, true, '[]'::jsonb);

-- ============================================================
-- Cenario 1: gate por plano
-- ============================================================
do $$
begin
  if not estabelecimento_permite_clube_assinatura('70000000-0000-0000-0000-000000000011') then
    raise exception 'Pro deveria permitir clube de assinatura';
  end if;
  if estabelecimento_permite_clube_assinatura('70000000-0000-0000-0000-000000000012') then
    raise exception 'Free nao deveria permitir clube de assinatura';
  end if;
  raise notice 'cenario 1 (gate por plano): OK';
end $$;

-- ============================================================
-- Cenario 2: assinar cria assinatura+pagamento pendentes; bloqueado no Free
-- ============================================================
do $$
declare
  v_resultado record;
begin
  select * into v_resultado from criar_assinatura_publica_pix(
    '70000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000041',
    'Cliente Clube', '+5547999992001', 'cliente@exemplo.invalid'
  );

  if v_resultado.assinatura_id is null or v_resultado.pagamento_id is null then
    raise exception 'cenario 2: deveria retornar assinatura_id e pagamento_id';
  end if;
  if (select status from assinaturas_clientes where id = v_resultado.assinatura_id) <> 'pendente' then
    raise exception 'cenario 2: assinatura deveria nascer pendente';
  end if;
  if (select valor_centavos from pagamentos where id = v_resultado.pagamento_id) <> 8000 then
    raise exception 'cenario 2: pagamento deveria ser o preco do plano (8000)';
  end if;

  begin
    perform criar_assinatura_publica_pix(
      '70000000-0000-0000-0000-000000000012', '70000000-0000-0000-0000-000000000042',
      'Cliente Free', '+5547999992002', 'cliente2@exemplo.invalid'
    );
    raise exception 'cenario 2: deveria ter bloqueado (estabelecimento Free)';
  exception
    when others then
      if sqlerrm <> 'clube de assinatura indisponivel para este estabelecimento' then
        raise exception 'cenario 2: esperava erro de gate, veio: %', sqlerrm;
      end if;
  end;

  raise notice 'cenario 2 (assinar cria pendente, gate bloqueia no Free): OK';
end $$;

-- ============================================================
-- Cenario 3: "webhook aprovado" (update direto, mesma logica da rota) ativa a assinatura;
-- assinatura_disponivel_para_servico so cobre dentro da quota do ciclo
-- ============================================================
do $$
declare
  v_assinatura_id uuid := (select id from assinaturas_clientes where cliente_id = (select id from clientes where telefone = '+5547999992001' and estabelecimento_id = '70000000-0000-0000-0000-000000000011'));
  v_cliente_id uuid := (select cliente_id from assinaturas_clientes where id = v_assinatura_id);
  v_disponivel uuid;
begin
  update assinaturas_clientes set status = 'ativa', ciclo_inicio = now(), ciclo_fim = now() + interval '30 days', usos_ciclo = '{}'
    where id = v_assinatura_id;

  v_disponivel := assinatura_disponivel_para_servico(v_cliente_id, '70000000-0000-0000-0000-000000000031');
  if v_disponivel is distinct from v_assinatura_id then
    raise exception 'cenario 3: assinatura ativa com quota livre deveria cobrir o servico';
  end if;

  update assinaturas_clientes set usos_ciclo = '{"70000000-0000-0000-0000-000000000031": 2}' where id = v_assinatura_id;
  v_disponivel := assinatura_disponivel_para_servico(v_cliente_id, '70000000-0000-0000-0000-000000000031');
  if v_disponivel is not null then
    raise exception 'cenario 3: quota esgotada (2 de 2) nao deveria mais cobrir';
  end if;

  update assinaturas_clientes set usos_ciclo = '{}' where id = v_assinatura_id;
  raise notice 'cenario 3 (webhook ativa, cobertura respeita quota do ciclo): OK';
end $$;

-- ============================================================
-- Cenario 4: agendamento com cobertura nao gera cobranca e incrementa usos_ciclo
-- (criar_agendamento_publico_pix, cliente pediu pix mas a assinatura absorve tudo)
-- ============================================================
do $$
declare
  v_data date := current_date + interval '30 days';
  v_inicio timestamptz;
  v_resultado record;
  v_pagamento pagamentos;
begin
  select min(inicio) into v_inicio
  from slots_disponiveis(
    '70000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000021',
    '70000000-0000-0000-0000-000000000031', v_data
  );
  if v_inicio is null then
    raise exception 'cenario 4: nao achou slot disponivel pra testar';
  end if;

  select * into v_resultado from criar_agendamento_publico_pix(
    '70000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000021',
    '70000000-0000-0000-0000-000000000031', v_inicio,
    'Cliente Clube', '+5547999992001', 'cliente@exemplo.invalid', 'pix'
  );

  if v_resultado.agendamento_id is null or v_resultado.pagamento_id is null then
    raise exception 'cenario 4: deveria retornar agendamento_id e pagamento_id mesmo coberto';
  end if;
  if (select status from agendamentos where id = v_resultado.agendamento_id) <> 'confirmado' then
    raise exception 'cenario 4: agendamento coberto deveria nascer confirmado, nao pendente';
  end if;

  select * into v_pagamento from pagamentos where id = v_resultado.pagamento_id;
  if v_pagamento.metodo <> 'assinatura' or v_pagamento.status <> 'pago' or v_pagamento.valor_centavos <> 0 then
    raise exception 'cenario 4: pagamento deveria ser metodo=assinatura, status=pago, valor=0 (veio %/%/%)',
      v_pagamento.metodo, v_pagamento.status, v_pagamento.valor_centavos;
  end if;

  if (select (usos_ciclo->>'70000000-0000-0000-0000-000000000031')::int
      from assinaturas_clientes
      where cliente_id = (select id from clientes where telefone = '+5547999992001' and estabelecimento_id = '70000000-0000-0000-0000-000000000011')
    ) <> 1 then
    raise exception 'cenario 4: usos_ciclo deveria ter incrementado pra 1';
  end if;

  raise notice 'cenario 4 (agendamento coberto: sem cobranca, confirma direto, incrementa uso): OK';
end $$;

-- ============================================================
-- Cenario 5: cron de inadimplencia (mesma query da rota) para de cobrir depois do ciclo vencer
-- ============================================================
do $$
declare
  v_assinatura_id uuid := (select id from assinaturas_clientes where cliente_id = (select id from clientes where telefone = '+5547999992001' and estabelecimento_id = '70000000-0000-0000-0000-000000000011'));
  v_cliente_id uuid := (select cliente_id from assinaturas_clientes where id = v_assinatura_id);
begin
  update assinaturas_clientes set ciclo_fim = now() - interval '1 day' where id = v_assinatura_id;

  update assinaturas_clientes set status = 'inadimplente'
    where status = 'ativa' and ciclo_fim < now() and id = v_assinatura_id;

  if (select status from assinaturas_clientes where id = v_assinatura_id) <> 'inadimplente' then
    raise exception 'cenario 5: assinatura deveria ter virado inadimplente';
  end if;
  if assinatura_disponivel_para_servico(v_cliente_id, '70000000-0000-0000-0000-000000000031') is not null then
    raise exception 'cenario 5: assinatura inadimplente nao deveria mais cobrir';
  end if;

  raise notice 'cenario 5 (cron marca inadimplente e para de cobrir): OK';
end $$;

-- ============================================================
-- Cenario 6: reativacao via nova assinatura publica reusa a mesma linha (on conflict)
-- ============================================================
do $$
declare
  v_assinatura_id_original uuid := (select id from assinaturas_clientes where cliente_id = (select id from clientes where telefone = '+5547999992001' and estabelecimento_id = '70000000-0000-0000-0000-000000000011'));
  v_resultado record;
begin
  select * into v_resultado from criar_assinatura_publica_pix(
    '70000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000041',
    'Cliente Clube', '+5547999992001', 'cliente@exemplo.invalid'
  );

  if v_resultado.assinatura_id <> v_assinatura_id_original then
    raise exception 'cenario 6: reassinar deveria reusar a mesma linha (mesmo id)';
  end if;
  if (select status from assinaturas_clientes where id = v_resultado.assinatura_id) <> 'pendente' then
    raise exception 'cenario 6: reassinar deveria voltar pra pendente';
  end if;

  raise notice 'cenario 6 (reativacao reusa a mesma linha via on conflict): OK';
end $$;

-- ============================================================
-- Cenario 7: isolamento entre estabelecimentos -- o mesmo telefone usado nos cenarios acima gera
-- um cliente (e uma assinatura) so em Clube Teste Pro, nunca vazando pra outro estabelecimento.
-- ============================================================
do $$
declare
  v_qtd_a int;
  v_qtd_outros int;
begin
  select count(*) into v_qtd_a
  from assinaturas_clientes ac
  join clientes cl on cl.id = ac.cliente_id
  where cl.telefone = '+5547999992001' and ac.estabelecimento_id = '70000000-0000-0000-0000-000000000011';

  select count(*) into v_qtd_outros
  from assinaturas_clientes ac
  where ac.cliente_id in (select id from clientes where telefone = '+5547999992001')
    and ac.estabelecimento_id <> '70000000-0000-0000-0000-000000000011';

  if v_qtd_a <> 1 then
    raise exception 'cenario 7: deveria haver exatamente 1 assinatura pro telefone em Clube Teste Pro, veio %', v_qtd_a;
  end if;
  if v_qtd_outros <> 0 then
    raise exception 'cenario 7: nao deveria haver assinatura desse telefone em nenhum outro estabelecimento, veio %', v_qtd_outros;
  end if;

  raise notice 'cenario 7 (isolamento entre estabelecimentos): OK';
end $$;

rollback;
