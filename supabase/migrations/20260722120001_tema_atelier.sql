-- Terceiro template de home publica (alem de "classico" gratis e "prestigio"): leitura editorial
-- com a secao "O Ritual" (passos numerados do atendimento, guardados em estabelecimentos.config.ritual
-- -- ver web/app/(public)/b/[slug]/home-atelier.tsx e o formulario em
-- web/app/(app)/app/configuracoes/template/ritual-form.tsx). Preco/gratuidade sao editaveis depois
-- em /admin/temas como qualquer outro tema da plataforma; valor inicial so pra nao nascer com 0.
insert into temas_plataforma (chave, nome, descricao, preco_centavos, gratis, ativo)
values (
  'atelier',
  'Atelier',
  'Leitura editorial da home: tipografia grande, seção "O Ritual" com os passos do seu atendimento, cardápio de serviços com preço alinhado, e microanimações de rolagem. Combine com qualquer paleta de cor em Aparência.',
  14900,
  false,
  true
)
on conflict (chave) do nothing;
