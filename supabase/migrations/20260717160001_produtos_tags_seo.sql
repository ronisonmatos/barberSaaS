-- Tags de organizacao + campos de SEO (titulo/descricao de busca) e slug pra pagina publica
-- individual do produto (/b/{slug}/loja/{produto}).
alter table produtos
  add column tags text[] not null default '{}',
  add column slug text,
  add column meta_titulo text,
  add column meta_descricao text;

-- Backfill defensivo (produtos existentes, se houver): slugify simples + sufixo do id pra
-- garantir unicidade sem precisar de loop de colisao.
update produtos set slug = lower(regexp_replace(regexp_replace(nome, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')) || '-' || substr(id::text, 1, 8)
where slug is null;

alter table produtos alter column slug set not null;
create unique index idx_produtos_estabelecimento_slug on produtos (estabelecimento_id, slug);
