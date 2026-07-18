-- Reconcilia profissionais/membros/fotos com os limites do plano atual do estabelecimento.
-- Chamada sempre que plano_plataforma_id muda (cron de trial, admin trocando plano, confirmacao
-- de pagamento da assinatura da plataforma). Idempotente: pode rodar quantas vezes quiser.
--
-- Regra geral por tabela: ordena os candidatos (mais antigo primeiro), mantem ativos os N
-- primeiros (N = limite do plano) e desativa o resto marcando desativado_por_limite_plano = true
-- (nunca deleta). Se o limite aumentar depois (upgrade), os que foram desativados por ESTA funcao
-- voltam a ficar ativos automaticamente. Linhas que o dono desativou manualmente (ativo = false e
-- desativado_por_limite_plano = false) nunca sao tocadas -- ficam fora do "pool" de candidatos.
create or replace function aplicar_limites_plano(p_estabelecimento_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_plano_id uuid;
  v_max_profissionais int;
  v_max_usuarios int;
  v_max_fotos int;
begin
  select plano_plataforma_id into v_plano_id from estabelecimentos where id = p_estabelecimento_id;
  if v_plano_id is null then
    return;
  end if;

  select max_profissionais, max_usuarios, max_fotos
    into v_max_profissionais, v_max_usuarios, v_max_fotos
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
end;
$$;
