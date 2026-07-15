-- Fase 0: nucleo da plataforma (ORIENTACAO-BARBERSAAS.md secao 5.2)

-- Perfil de usuario (espelha auth.users)
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  telefone text,
  papel papel_global not null default 'usuario',
  created_at timestamptz not null default now()
);

-- Planos que a PLATAFORMA vende para as barbearias
create table planos_plataforma (
  id uuid primary key default gen_random_uuid(),
  nome text not null,                      -- ex: 'Essencial', 'Pro'
  preco_centavos int not null,
  max_profissionais int,                   -- null = ilimitado
  recursos jsonb not null default '{}',    -- flags: {"whatsapp": true, "relatorios": true}
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table barbearias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,               -- pagina publica /b/{slug}
  telefone_whatsapp text,
  descricao text,
  logo_url text,
  endereco jsonb,                          -- {rua, numero, bairro, cidade, uf, cep}
  timezone text not null default 'America/Sao_Paulo',
  status status_barbearia not null default 'trial',
  trial_ate date,
  plano_plataforma_id uuid references planos_plataforma(id),
  asaas_customer_id text,                  -- barbearia como CLIENTE da plataforma
  asaas_subconta_id text,                  -- barbearia como RECEBEDORA dos proprios clientes
  ativacao_manual boolean not null default false,  -- true = super_admin travou o status manualmente
  config jsonb not null default '{}',      -- {modo_cobranca_default, percentual_sinal, antecedencia_min_horas, ...}
  created_at timestamptz not null default now()
);

-- Assinatura da barbearia com a plataforma
create table assinaturas_plataforma (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  plano_plataforma_id uuid not null references planos_plataforma(id),
  status status_assinatura not null default 'ativa',
  gateway_subscription_id text,            -- id da assinatura no Asaas
  proximo_vencimento date,
  created_at timestamptz not null default now()
);

-- Vinculo usuario <-> barbearia (painel)
create table membros_barbearia (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  papel papel_membro not null default 'staff',
  unique (barbearia_id, usuario_id)
);
