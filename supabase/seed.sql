-- Seed de desenvolvimento: 1 estabelecimento demo com servicos, profissional e jornada.
-- Nao inclui usuarios/auth.users (criar via signup ou Supabase Studio).

insert into planos_plataforma (id, nome, preco_centavos, max_profissionais, recursos, ativo)
values
  ('00000000-0000-0000-0000-000000000001', 'Essencial', 9900, 3, '{"whatsapp": true, "relatorios": false}', true),
  ('00000000-0000-0000-0000-000000000002', 'Pro', 19900, null, '{"whatsapp": true, "relatorios": true}', true);

insert into estabelecimentos (id, nome, slug, telefone_whatsapp, descricao, timezone, status, trial_ate, plano_plataforma_id, config)
values (
  '00000000-0000-0000-0000-0000000000b1',
  'Estabelecimento Demo',
  'estabelecimento-demo',
  '+5547999999999',
  'Estabelecimento de demonstracao para desenvolvimento local.',
  'America/Sao_Paulo',
  'trial',
  current_date + interval '14 days',
  '00000000-0000-0000-0000-000000000001',
  '{"modo_cobranca_default": "no_local", "percentual_sinal": 30, "antecedencia_min_horas": 2}'
);

insert into profissionais (id, estabelecimento_id, nome, comissao_percentual, ativo)
values (
  '00000000-0000-0000-0000-0000000000f1',
  '00000000-0000-0000-0000-0000000000b1',
  'Joao Barbeiro',
  40,
  true
);

insert into servicos (id, estabelecimento_id, nome, descricao, duracao_minutos, preco_centavos, categoria, ativo)
values
  ('00000000-0000-0000-0000-00000000ae01', '00000000-0000-0000-0000-0000000000b1', 'Corte masculino', 'Corte tradicional', 30, 4000, 'corte', true),
  ('00000000-0000-0000-0000-00000000ae02', '00000000-0000-0000-0000-0000000000b1', 'Barba', 'Barba completa', 20, 2500, 'barba', true);

insert into profissional_servicos (profissional_id, servico_id)
values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000ae01'),
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000ae02');

-- Jornada: seg a sex, 09-12 e 13-19
insert into jornadas (estabelecimento_id, profissional_id, dia_semana, hora_inicio, hora_fim)
select '00000000-0000-0000-0000-0000000000b1'::uuid, '00000000-0000-0000-0000-0000000000f1'::uuid, dia, '09:00'::time, '12:00'::time
from generate_series(1, 5) as dia
union all
select '00000000-0000-0000-0000-0000000000b1'::uuid, '00000000-0000-0000-0000-0000000000f1'::uuid, dia, '13:00'::time, '19:00'::time
from generate_series(1, 5) as dia;

insert into clientes (id, estabelecimento_id, nome, telefone)
values (
  '00000000-0000-0000-0000-0000000000c1',
  '00000000-0000-0000-0000-0000000000b1',
  'Cliente Demo',
  '+5547988888888'
);
