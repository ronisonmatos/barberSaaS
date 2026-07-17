-- Suporte ao novo layout da pagina publica (design "1A Classico"): campos de perfil extra
-- (sobre, horario em texto livre, instagram) + galeria de fotos com limite por plano.
-- `descricao` (ja existe) vira a tagline curta abaixo do nome; `endereco` (ja existe, jsonb
-- {rua,numero,bairro,cidade,uf,cep}) vira o card de endereco -- nao precisam de coluna nova.

alter table estabelecimentos add column sobre text;
alter table estabelecimentos add column horario_texto text;
alter table estabelecimentos add column instagram_url text;

alter table planos_plataforma add column max_fotos int;
update planos_plataforma set max_fotos = 10 where nome = 'Essencial';
update planos_plataforma set max_fotos = 20 where nome = 'Pro';
-- Sem plano (trial/free): fallback de 5 fotos, resolvido em codigo (mesmo padrao do
-- LIMITE_USUARIOS_SEM_PLANO em configuracoes/actions.ts).

create table estabelecimento_fotos (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  url text not null,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);
create index idx_estabelecimento_fotos_estabelecimento on estabelecimento_fotos (estabelecimento_id, ordem);

alter table estabelecimento_fotos enable row level security;

create policy "publico ve fotos de estabelecimento ativo" on estabelecimento_fotos for select
  to anon using (
    exists (
      select 1 from estabelecimentos e
      where e.id = estabelecimento_fotos.estabelecimento_id and e.status in ('ativa', 'trial')
    )
  );

create policy "membros leem fotos do proprio estabelecimento" on estabelecimento_fotos for select
  using (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin());

create policy "membros gerenciam fotos do proprio estabelecimento" on estabelecimento_fotos for all
  using (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin())
  with check (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin());

-- Reusa o bucket publico "logos" (path {estabelecimento_id}/...) para a galeria, so com um
-- prefixo a mais -- {estabelecimento_id}/galeria/{arquivo} -- as policies existentes ja
-- autorizam por (storage.foldername(name))[1], entao nao precisa de bucket/policy novos.
