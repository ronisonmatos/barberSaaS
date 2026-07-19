-- Correcao de rumo: o tema "prestigio" deixou de ser so uma paleta de cor e virou um LAYOUT
-- alternativo da home publica (ver web/app/(public)/b/[slug]/home-prestigio.tsx) -- cor continua
-- configuravel separadamente em Aparencia, independente do template escolhido aqui. So corrige o
-- texto do catalogo, sem mudar chave/preco.

update temas_plataforma
set descricao = 'Layout alternativo da home: cabeçalho fixo, hero amplo com mosaico de fotos, serviços e produtos em grade de cards, profissionais com foto — mais "site" do que "cartão único". Combine com qualquer paleta de cor em Aparência.'
where chave = 'prestigio';
