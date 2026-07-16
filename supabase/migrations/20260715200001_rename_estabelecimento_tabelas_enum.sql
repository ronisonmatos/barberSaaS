-- Rename "barbearia" -> "estabelecimento": tabelas, enum e constraints proprias delas.
-- O produto atende barbearias e saloes de beleza; o termo generico e "estabelecimento".

alter type status_barbearia rename to status_estabelecimento;

alter table barbearias rename to estabelecimentos;
alter table estabelecimentos rename constraint barbearias_pkey to estabelecimentos_pkey;
alter table estabelecimentos rename constraint barbearias_slug_key to estabelecimentos_slug_key;
alter table estabelecimentos rename constraint barbearias_plano_plataforma_id_fkey to estabelecimentos_plano_plataforma_id_fkey;

alter table membros_barbearia rename to membros_estabelecimento;
alter table membros_estabelecimento rename constraint membros_barbearia_pkey to membros_estabelecimento_pkey;
alter table membros_estabelecimento rename constraint membros_barbearia_usuario_id_fkey to membros_estabelecimento_usuario_id_fkey;

alter table planos_barbearia rename to planos_estabelecimento;
alter table planos_estabelecimento rename constraint planos_barbearia_pkey to planos_estabelecimento_pkey;
