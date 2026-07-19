-- Clube de assinatura do cliente final e recurso de plano pago, mesmo padrao booleano de
-- fidelidade/loja/pagamento_online: Free nao tem, Essencial/Pro tem. Trial/sem plano atribuido
-- fica liberado.
--
-- planos_estabelecimento ja tem policy publica desde a fundacao do projeto
-- ("publico ve planos_estabelecimento de estabelecimento ativo", 20260715170004_rls.sql /
-- renomeada em 20260715200004_rename_policies_estabelecimento.sql) -- so faltava o gate por
-- plano, entao a policy e recriada aqui com a checagem extra (mesmo padrao usado em
-- 20260717150002_gate_loja_por_plano.sql pra produtos).

update planos_plataforma set recursos = recursos || '{"clube_assinatura": false}'::jsonb
where nome = 'Free';
update planos_plataforma set recursos = recursos || '{"clube_assinatura": true}'::jsonb
where nome in ('Essencial', 'Pro');

create or replace function estabelecimento_permite_clube_assinatura(p_estabelecimento_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when e.plano_plataforma_id is null then true
    else coalesce((pp.recursos->>'clube_assinatura')::boolean, false)
  end
  from estabelecimentos e
  left join planos_plataforma pp on pp.id = e.plano_plataforma_id
  where e.id = p_estabelecimento_id;
$$;

drop policy "publico ve planos_estabelecimento de estabelecimento ativo" on planos_estabelecimento;

create policy "publico ve planos_estabelecimento de estabelecimento ativo" on planos_estabelecimento for select
  to anon using (
    ativo and estabelecimento_permite_clube_assinatura(estabelecimento_id) and exists (
      select 1 from estabelecimentos e
      where e.id = planos_estabelecimento.estabelecimento_id and e.status in ('ativa', 'trial')
    )
  );
