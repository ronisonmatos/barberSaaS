-- Fase 0: dominio da barbearia, tudo com barbearia_id (ORIENTACAO-BARBERSAAS.md secao 5.3)

create extension if not exists btree_gist;

create table profissionais (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  usuario_id uuid references usuarios(id),        -- opcional: profissional com login
  nome text not null,
  foto_url text,
  comissao_percentual numeric(5,2) not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table servicos (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  nome text not null,                             -- ex: 'Corte masculino'
  descricao text,
  duracao_minutos int not null check (duracao_minutos > 0),
  preco_centavos int not null check (preco_centavos >= 0),
  categoria text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Quais servicos cada profissional executa
create table profissional_servicos (
  profissional_id uuid not null references profissionais(id) on delete cascade,
  servico_id uuid not null references servicos(id) on delete cascade,
  primary key (profissional_id, servico_id)
);

-- Jornada semanal do profissional (0 = domingo ... 6 = sabado)
create table jornadas (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  profissional_id uuid not null references profissionais(id) on delete cascade,
  dia_semana int not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fim time not null,
  check (hora_fim > hora_inicio)
);
-- Intervalos (almoco) = duas linhas de jornada no mesmo dia (ex: 09-12 e 13-19)

-- Bloqueios pontuais: folga, feriado, imprevisto (profissional_id null = barbearia inteira)
create table bloqueios (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  profissional_id uuid references profissionais(id) on delete cascade,
  inicio timestamptz not null,
  fim timestamptz not null,
  motivo text,
  check (fim > inicio)
);

create table clientes (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  user_id uuid references usuarios(id),           -- preenchido quando o cliente cria conta (fase 2)
  nome text not null,
  telefone text not null,                          -- E.164: +5547999999999
  email text,
  observacoes text,
  token_acesso uuid not null default gen_random_uuid(),  -- link magico de gerenciamento (fase 1)
  created_at timestamptz not null default now(),
  unique (barbearia_id, telefone)
);

-- Planos que a BARBEARIA vende para os clientes dela
create table planos_barbearia (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  nome text not null,                              -- ex: 'Clube do Corte'
  preco_centavos int not null,
  descricao text,
  regras jsonb not null default '[]',
  -- ex: [{"servico_id": "...", "quantidade_mes": 2}] ou [{"categoria": "corte", "ilimitado": true}]
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table assinaturas_clientes (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete cascade,
  plano_id uuid not null references planos_barbearia(id),
  status status_assinatura not null default 'ativa',
  gateway_subscription_id text,
  ciclo_inicio date not null,
  ciclo_fim date not null,
  usos_ciclo jsonb not null default '{}',          -- {"servico_id": 1} consumos no ciclo atual
  created_at timestamptz not null default now()
);

create table agendamentos (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  cliente_id uuid not null references clientes(id),
  profissional_id uuid not null references profissionais(id),
  servico_id uuid not null references servicos(id),
  inicio timestamptz not null,
  fim timestamptz not null,                        -- inicio + duracao do servico (congelada no ato)
  status status_agendamento not null default 'pendente',
  origem text not null default 'online',           -- online | painel | whatsapp
  assinatura_cliente_id uuid references assinaturas_clientes(id),  -- se consumiu plano
  preco_centavos int not null,                     -- preco congelado no ato
  observacoes text,
  created_at timestamptz not null default now(),
  check (fim > inicio)
);
create index idx_agendamentos_agenda on agendamentos (barbearia_id, profissional_id, inicio);

-- Anti-overbooking no nivel do banco (defesa final contra corrida):
alter table agendamentos add constraint agendamentos_sem_conflito
  exclude using gist (
    profissional_id with =,
    tstzrange(inicio, fim) with &&
  ) where (status in ('pendente', 'confirmado'));

create table pagamentos (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  agendamento_id uuid references agendamentos(id),
  assinatura_cliente_id uuid references assinaturas_clientes(id),
  cliente_id uuid references clientes(id),
  valor_centavos int not null,
  metodo metodo_pagamento not null,
  status status_pagamento not null default 'pendente',
  gateway_payment_id text,
  pago_em timestamptz,
  created_at timestamptz not null default now()
);

create table mensagens_whatsapp (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  cliente_id uuid references clientes(id),
  agendamento_id uuid references agendamentos(id),
  tipo text not null,                              -- lembrete_24h | confirmacao | recuperacao | manual
  conteudo text,
  status text not null default 'enviada',          -- enviada | falhou
  created_at timestamptz not null default now()
);

-- Log de eventos de webhook (idempotencia e auditoria)
create table webhook_eventos (
  id uuid primary key default gen_random_uuid(),
  origem text not null,                            -- asaas | whatsapp
  evento_id_externo text not null unique,          -- garante processamento unico
  payload jsonb not null,
  processado_em timestamptz,
  created_at timestamptz not null default now()
);
