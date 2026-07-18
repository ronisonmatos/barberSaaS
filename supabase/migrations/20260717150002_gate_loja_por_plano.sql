-- Loja e recurso de plano pago: Free nao tem (recursos.loja=false, max_produtos=0), Essencial/Pro
-- tem, cada um com seu limite de itens. Durante o trial (sem plano atribuido) fica liberado --
-- mesmo padrao ja usado em estabelecimento_permite_pagamento_online.

alter table planos_plataforma add column max_produtos int;

update planos_plataforma set max_produtos = 0, recursos = recursos || '{"loja": false}'::jsonb
where nome = 'Free';
update planos_plataforma set max_produtos = 20, recursos = recursos || '{"loja": true}'::jsonb
where nome = 'Essencial';
update planos_plataforma set max_produtos = null, recursos = recursos || '{"loja": true}'::jsonb
where nome = 'Pro';

create or replace function estabelecimento_permite_loja(p_estabelecimento_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when e.plano_plataforma_id is null then true
    else coalesce((pp.recursos->>'loja')::boolean, false)
  end
  from estabelecimentos e
  left join planos_plataforma pp on pp.id = e.plano_plataforma_id
  where e.id = p_estabelecimento_id;
$$;

create policy "publico ve produtos de estabelecimento ativo" on produtos for select
  to anon using (
    ativo and estabelecimento_permite_loja(estabelecimento_id) and exists (
      select 1 from estabelecimentos e
      where e.id = produtos.estabelecimento_id and e.status in ('ativa', 'trial')
    )
  );

-- Estende aplicar_limites_plano (20260717130004) com o mesmo bloco ja usado por
-- profissionais/membros/fotos, agora tambem para produtos.
create or replace function aplicar_limites_plano(p_estabelecimento_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_plano_id uuid;
  v_max_profissionais int;
  v_max_usuarios int;
  v_max_fotos int;
  v_max_produtos int;
begin
  select plano_plataforma_id into v_plano_id from estabelecimentos where id = p_estabelecimento_id;
  if v_plano_id is null then
    return;
  end if;

  select max_profissionais, max_usuarios, max_fotos, max_produtos
    into v_max_profissionais, v_max_usuarios, v_max_fotos, v_max_produtos
    from planos_plataforma where id = v_plano_id;

  -- Profissionais: exclui do pool quem foi desativado manualmente pelo dono.
  if v_max_profissionais is null then
    update profissionais set ativo = true, desativado_por_limite_plano = false
      where estabelecimento_id = p_estabelecimento_id and desativado_por_limite_plano = true;
  else
    with pool as (
      select id, row_number() over (order by created_at asc) as rn
      from profissionais
      where estabelecimento_id = p_estabelecimento_id
        and not (ativo = false and desativado_por_limite_plano = false)
    )
    update profissionais p set
      ativo = (pool.rn <= v_max_profissionais),
      desativado_por_limite_plano = (pool.rn > v_max_profissionais)
    from pool
    where p.id = pool.id;
  end if;

  -- Membros: owner nunca e desativado, mas consome 1 vaga de max_usuarios. Staff sem coluna de
  -- desativacao manual ainda (so existe remover/deletar), entao o pool e todo mundo.
  if v_max_usuarios is null then
    update membros_estabelecimento set ativo = true, desativado_por_limite_plano = false
      where estabelecimento_id = p_estabelecimento_id and papel = 'staff'
        and desativado_por_limite_plano = true;
  else
    with pool as (
      select id, row_number() over (order by created_at asc) as rn
      from membros_estabelecimento
      where estabelecimento_id = p_estabelecimento_id and papel = 'staff'
    )
    update membros_estabelecimento m set
      ativo = (pool.rn <= greatest(v_max_usuarios - 1, 0)),
      desativado_por_limite_plano = (pool.rn > greatest(v_max_usuarios - 1, 0))
    from pool
    where m.id = pool.id;
  end if;

  -- Fotos: sem desativacao manual hoje (so delete), pool e todo mundo; ordem = ordem de upload.
  if v_max_fotos is null then
    update estabelecimento_fotos set ativo = true, desativado_por_limite_plano = false
      where estabelecimento_id = p_estabelecimento_id and desativado_por_limite_plano = true;
  else
    with pool as (
      select id, row_number() over (order by ordem asc) as rn
      from estabelecimento_fotos
      where estabelecimento_id = p_estabelecimento_id
    )
    update estabelecimento_fotos f set
      ativo = (pool.rn <= v_max_fotos),
      desativado_por_limite_plano = (pool.rn > v_max_fotos)
    from pool
    where f.id = pool.id;
  end if;

  -- Produtos: exclui do pool quem foi desativado manualmente pelo dono (mesmo padrao de
  -- profissionais). Free tem max_produtos=0, entao todos ficam desativados por limite ali.
  if v_max_produtos is null then
    update produtos set ativo = true, desativado_por_limite_plano = false
      where estabelecimento_id = p_estabelecimento_id and desativado_por_limite_plano = true;
  else
    with pool as (
      select id, row_number() over (order by created_at asc) as rn
      from produtos
      where estabelecimento_id = p_estabelecimento_id
        and not (ativo = false and desativado_por_limite_plano = false)
    )
    update produtos p set
      ativo = (pool.rn <= v_max_produtos),
      desativado_por_limite_plano = (pool.rn > v_max_produtos)
    from pool
    where p.id = pool.id;
  end if;
end;
$$;
