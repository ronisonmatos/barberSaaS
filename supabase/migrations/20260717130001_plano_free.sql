-- Plano Free real (antes so existia fallback hardcoded em codigo pra "sem plano").
-- Estabelecimento cai aqui automaticamente quando o trial vence sem ter contratado outro plano
-- (ver cron expirar-trial). recursos.suporte vira texto dedicado no card (ver plano-card.tsx).
insert into planos_plataforma (nome, preco_centavos, max_profissionais, max_usuarios, max_fotos, recursos, ativo)
values ('Free', 0, 1, 1, 3, '{"suporte": "limitado"}', true);

update planos_plataforma set recursos = recursos || '{"suporte": "prioritario"}'::jsonb
where nome in ('Essencial', 'Pro');
