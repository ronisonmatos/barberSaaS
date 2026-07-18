-- Planos promocionais: preco (fixo ou percentual) valido so pra quem assinar dentro de um prazo
-- de adesao, aplicado nos primeiros N meses (ou pra sempre, se duracao for null). A assinatura
-- nao e recorrente automatica (cada renovacao e uma cobranca manual que soma +1 mes em
-- assinaturas_plataforma.proximo_vencimento -- ver web/lib/assinatura-plataforma.ts), entao o
-- preco promocional e TRAVADO na assinatura no momento em que e concedido (preco_promocional_*),
-- sobrevivendo a mudancas futuras no plano e revertendo sozinho pro preco cheio quando vencer.

alter table planos_plataforma add column promocao_ativa boolean not null default false;
alter table planos_plataforma add column promocao_tipo text check (promocao_tipo in ('preco_fixo', 'percentual'));
alter table planos_plataforma add column promocao_valor_centavos int;
alter table planos_plataforma add column promocao_percentual numeric(5,2);
alter table planos_plataforma add column promocao_duracao_meses int;
alter table planos_plataforma add column promocao_assinar_ate date;
alter table planos_plataforma add column promocao_titulo text;

alter table assinaturas_plataforma add column preco_promocional_centavos int;
alter table assinaturas_plataforma add column preco_promocional_ate date;
