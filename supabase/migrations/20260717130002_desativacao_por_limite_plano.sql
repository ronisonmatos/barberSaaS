-- Colunas de controle pra downgrade/upgrade automatico de plano (ver rpc aplicar_limites_plano).
-- desativado_por_limite_plano distingue "desativado pelo sistema por causa do limite do plano"
-- (reversivel automaticamente num upgrade) de "desativado manualmente pelo dono" (nunca mexido
-- pela funcao de reconciliacao).
alter table profissionais add column desativado_por_limite_plano boolean not null default false;

alter table membros_estabelecimento add column ativo boolean not null default true;
alter table membros_estabelecimento add column desativado_por_limite_plano boolean not null default false;

alter table estabelecimento_fotos add column ativo boolean not null default true;
alter table estabelecimento_fotos add column desativado_por_limite_plano boolean not null default false;
