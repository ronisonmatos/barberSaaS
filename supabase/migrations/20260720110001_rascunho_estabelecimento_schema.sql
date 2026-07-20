-- Estabelecimento "rascunho": pagina de demonstracao criada pelo super_admin sem dono ainda,
-- reivindicavel por convite. status continua 'trial' com trial_ate null (fica fora do alcance
-- do cron expirar-trial, que filtra trial_ate < hoje) ate ser reivindicado.

alter table estabelecimentos add column rascunho boolean not null default false;
alter table estabelecimentos add column rascunho_expira_em timestamptz;

alter table estabelecimentos add constraint rascunho_expira_em_coerente
  check ((rascunho and rascunho_expira_em is not null) or (not rascunho and rascunho_expira_em is null));

create index idx_estabelecimentos_rascunho_expira on estabelecimentos (rascunho_expira_em) where rascunho;
