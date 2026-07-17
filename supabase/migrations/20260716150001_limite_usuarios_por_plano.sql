-- Limite de contas de usuario (membros do painel) por plano da plataforma.
-- NULL = ilimitado (mesma convencao de max_profissionais). Estabelecimento sem plano
-- atribuido (trial/free, plano_plataforma_id null) usa fallback de 1 usuario, resolvido em
-- codigo (nao ha linha "Free" em planos_plataforma hoje).
alter table planos_plataforma add column max_usuarios int;

update planos_plataforma set max_usuarios = 2 where nome = 'Essencial';
update planos_plataforma set max_usuarios = 5 where nome = 'Pro';

-- Corrige brecha de seguranca: a policy de escrita em membros_estabelecimento usava
-- meus_estabelecimentos() (qualquer papel), entao staff conseguia inserir/remover vinculos --
-- inclusive se auto-promover a owner ou remover o owner de verdade. So owner deveria gerenciar.
create or replace function estabelecimentos_que_possuo() returns setof uuid
language sql stable security definer set search_path = public as $$
  select estabelecimento_id from membros_estabelecimento
  where usuario_id = auth.uid() and papel = 'owner';
$$;

drop policy "owners gerenciam vinculos do proprio estabelecimento" on membros_estabelecimento;

create policy "owners gerenciam vinculos do proprio estabelecimento" on membros_estabelecimento for all
  using (estabelecimento_id in (select estabelecimentos_que_possuo()) or eh_super_admin())
  with check (estabelecimento_id in (select estabelecimentos_que_possuo()) or eh_super_admin());
