-- Testes de verificacao do indice unico de slug por estabelecimento (tags/SEO da leva de
-- cadastro de produto). Roda dentro de uma transacao que sempre da ROLLBACK.
-- Uso: supabase db query --linked -f supabase/tests/produtos_slug.sql

begin;

insert into estabelecimentos (id, nome, slug, timezone, status)
values
  ('60000000-0000-0000-0000-000000000001', 'Slug Teste A', 'slug-teste-a', 'America/Sao_Paulo', 'ativa'),
  ('60000000-0000-0000-0000-000000000002', 'Slug Teste B', 'slug-teste-b', 'America/Sao_Paulo', 'ativa');

insert into produtos (id, estabelecimento_id, nome, preco_centavos, slug)
values ('60000000-0000-0000-0000-000000000011', '60000000-0000-0000-0000-000000000001', 'Pomada Modeladora', 3000, 'pomada-modeladora');

do $$
begin
  -- mesmo slug, mesmo estabelecimento -> deve bloquear
  begin
    insert into produtos (estabelecimento_id, nome, preco_centavos, slug)
    values ('60000000-0000-0000-0000-000000000001', 'Outra Pomada', 2500, 'pomada-modeladora');
    raise exception 'deveria ter bloqueado slug duplicado no mesmo estabelecimento';
  exception
    when unique_violation then
      raise notice 'bloqueio de slug duplicado no mesmo estabelecimento: OK';
  end;

  -- mesmo slug, estabelecimento diferente -> deve permitir
  insert into produtos (estabelecimento_id, nome, preco_centavos, slug)
  values ('60000000-0000-0000-0000-000000000002', 'Pomada Modeladora', 3000, 'pomada-modeladora');
  raise notice 'mesmo slug em estabelecimentos diferentes: OK';
end $$;

rollback;
