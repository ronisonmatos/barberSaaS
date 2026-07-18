-- membros_estabelecimento nunca teve created_at (so id/estabelecimento_id/usuario_id/papel).
-- aplicar_limites_plano precisa de uma nocao de "mais antigo primeiro" pra decidir quem mantem a
-- vaga de usuario num downgrade.
alter table membros_estabelecimento add column created_at timestamptz not null default now();
