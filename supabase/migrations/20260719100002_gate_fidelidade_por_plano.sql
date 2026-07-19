-- Cartao fidelidade e recurso de plano pago (mesmo padrao booleano de
-- estabelecimento_permite_pagamento_online): Free nao tem, Essencial/Pro tem. Trial/sem plano
-- atribuido fica liberado. Puramente booleano, sem limite numerico -- downgrade nao apaga
-- programas existentes, so bloqueia criar novos (checado em codigo) e a concessao de selo
-- fica pausada silenciosamente (ver RPC atualizar_status_agendamento).

update planos_plataforma set recursos = recursos || '{"fidelidade": false}'::jsonb
where nome = 'Free';
update planos_plataforma set recursos = recursos || '{"fidelidade": true}'::jsonb
where nome in ('Essencial', 'Pro');

create or replace function estabelecimento_permite_fidelidade(p_estabelecimento_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when e.plano_plataforma_id is null then true
    else coalesce((pp.recursos->>'fidelidade')::boolean, false)
  end
  from estabelecimentos e
  left join planos_plataforma pp on pp.id = e.plano_plataforma_id
  where e.id = p_estabelecimento_id;
$$;
