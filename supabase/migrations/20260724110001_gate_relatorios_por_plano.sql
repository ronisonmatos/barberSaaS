-- Relatorios (Financeiro/Agendamentos/Produtos) viram recurso de plano: so o Pro tem. O rotulo
-- "Relatorios" ja existia solto em FLAG_LABEL (web/lib/planos.ts) e no seed, mas sem gate real nem
-- tela nenhuma -- essa migration cria o gate de verdade, mesmo padrao ja usado em loja/pagamento
-- online/fidelidade/clube de assinatura (trial sem plano atribuido continua liberado, so Free e
-- Essencial reais ficam bloqueados).
update planos_plataforma set recursos = recursos || '{"relatorios": false}'::jsonb
where nome in ('Free', 'Essencial');
update planos_plataforma set recursos = recursos || '{"relatorios": true}'::jsonb
where nome = 'Pro';

create or replace function estabelecimento_permite_relatorios(p_estabelecimento_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when e.plano_plataforma_id is null then true
    else coalesce((pp.recursos->>'relatorios')::boolean, false)
  end
  from estabelecimentos e
  left join planos_plataforma pp on pp.id = e.plano_plataforma_id
  where e.id = p_estabelecimento_id;
$$;
