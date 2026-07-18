-- Testes de verificacao do gate de pagamento online por plano.
-- Roda inteiro dentro de uma transacao que sempre da ROLLBACK.
-- Uso: supabase db query --linked -f supabase/tests/gate_pagamento_online.sql

begin;

insert into estabelecimentos (id, nome, slug, timezone, status, plano_plataforma_id)
values
  ('40000000-0000-0000-0000-000000000001', 'Teste Gate Free', 'teste-gate-free', 'America/Sao_Paulo', 'ativa',
    (select id from planos_plataforma where nome = 'Free')),
  ('40000000-0000-0000-0000-000000000002', 'Teste Gate Pro', 'teste-gate-pro', 'America/Sao_Paulo', 'ativa',
    (select id from planos_plataforma where nome = 'Pro')),
  ('40000000-0000-0000-0000-000000000003', 'Teste Gate Trial', 'teste-gate-trial', 'America/Sao_Paulo', 'trial',
    null);

insert into estabelecimento_pagamento_config (estabelecimento_id, gateway_ativo, aceita_pagamento_antecipado, aceita_pagamento_no_dia)
values
  ('40000000-0000-0000-0000-000000000001', 'mercado_pago', true, true),
  ('40000000-0000-0000-0000-000000000002', 'mercado_pago', true, true),
  ('40000000-0000-0000-0000-000000000003', 'mercado_pago', true, true);

do $$
begin
  if estabelecimento_permite_pagamento_online('40000000-0000-0000-0000-000000000001') then
    raise exception 'Free nao deveria permitir pagamento online';
  end if;
  if not estabelecimento_permite_pagamento_online('40000000-0000-0000-0000-000000000002') then
    raise exception 'Pro deveria permitir pagamento online';
  end if;
  if not estabelecimento_permite_pagamento_online('40000000-0000-0000-0000-000000000003') then
    raise exception 'trial (sem plano) deveria permitir pagamento online';
  end if;
  raise notice 'estabelecimento_permite_pagamento_online: OK';
end $$;

do $$
declare
  v_free record;
  v_pro record;
begin
  select * into v_free from formas_pagamento_publico('40000000-0000-0000-0000-000000000001');
  if v_free.aceita_pagamento_antecipado is not false then
    raise exception 'formas_pagamento_publico deveria zerar aceita_pagamento_antecipado pro Free mesmo com config true';
  end if;
  if v_free.aceita_pagamento_no_dia is not true then
    raise exception 'aceita_pagamento_no_dia nao deveria ser afetado pelo gate (nao e pagamento online)';
  end if;

  select * into v_pro from formas_pagamento_publico('40000000-0000-0000-0000-000000000002');
  if v_pro.aceita_pagamento_antecipado is not true then
    raise exception 'formas_pagamento_publico deveria manter aceita_pagamento_antecipado pro Pro';
  end if;

  raise notice 'formas_pagamento_publico: OK';
end $$;

do $$
begin
  begin
    perform criar_agendamento_publico_pix(
      '40000000-0000-0000-0000-000000000001', gen_random_uuid(), gen_random_uuid(), now() + interval '1 day',
      'Cliente Teste', '+5547999990000', 'cliente@exemplo.invalid', 'pix'
    );
    raise exception 'deveria ter bloqueado a RPC pro estabelecimento Free (chamada direta, ignorando a UI)';
  exception
    when others then
      if sqlerrm <> 'pagamento antecipado indisponivel para este estabelecimento' then
        raise exception 'esperava erro de plano bloqueado, veio: %', sqlerrm;
      end if;
  end;
  raise notice 'criar_agendamento_publico_pix bloqueia Free mesmo com config antiga: OK';
end $$;

rollback;
