# BarberSaaS — Documento de Estruturação do Projeto

> **Propósito deste documento:** especificação completa para iniciar o desenvolvimento com Claude Code.
> Leia este documento inteiro antes de escrever qualquer código. Ele define arquitetura, modelo de dados,
> regras de negócio e o roadmap por fases. Trabalhe uma fase por vez, na ordem definida.

---

## 1. Visão do produto

SaaS multi-tenant (estilo CRM) para **barbearias e salões de beleza** no Brasil.

- Cada estabelecimento é um **tenant** com dados 100% isolados.
- Cada estabelecimento tem uma **página pública própria** (`/b/{slug}`) onde seus clientes agendam e pagam.
- O **dono da plataforma** cobra assinatura mensal dos estabelecimentos (billing da plataforma).
- Os **estabelecimentos** cobram seus clientes por agendamento avulso ou plano de assinatura (ex: "2 cortes/mês").
- Comunicação com clientes via **WhatsApp** (lembretes, confirmações).

### Os três atores e suas aplicações

| Ator | Aplicação | Rota base |
|---|---|---|
| Dono da plataforma (super admin) | Painel admin da plataforma | `/admin` |
| Dono/staff do estabelecimento | Painel do estabelecimento | `/app` |
| Cliente final | Página pública do estabelecimento | `/b/{slug}` |

**Regra de ouro do isolamento:** cliente final só enxerga o(s) estabelecimento(s) em que foi cadastrado.
Um mesmo telefone pode ser cliente de mais de um estabelecimento — são registros de `clientes` distintos por tenant.

---

## 2. Stack

| Camada | Tecnologia | Motivo |
|---|---|---|
| Frontend web | **Next.js 14+ (App Router) + TypeScript + Tailwind** | SEO nas páginas públicas, um só projeto para os 3 painéis |
| Backend/BD | **Supabase** (Postgres, Auth, RLS, Edge Functions, Storage, Realtime) | Multi-tenant via RLS, já dominado pelo time |
| Pagamentos | **Asaas** (subcontas + split + Pix + assinaturas) | Dinheiro do cliente cai direto na conta do estabelecimento; plataforma retém taxa |
| WhatsApp | Fase 1: links `wa.me` + **WhatsApp Cloud API** (oficial) para lembretes | Sem risco de banimento |
| App mobile (futuro) | **Expo / React Native** consumindo o mesmo Supabase | Reaproveita backend inteiro |
| Deploy | Vercel (Next.js) + Supabase Cloud | Simples e barato no início |

**Decisões travadas (não mudar sem discutir):**
1. Multi-tenant por coluna `estabelecimento_id` + RLS (não usar schema-por-tenant nem banco-por-tenant).
2. Toda escrita sensível (pagamento, ativação de assinatura) acontece via **Edge Function/webhook**, nunca direto do client.
3. Datas/horas sempre em `timestamptz` UTC no banco; timezone do estabelecimento (`America/Sao_Paulo` default) aplicado na exibição e no cálculo de agenda.
4. Nunca versionar chaves. Usar `.env.local` (Next.js) e secrets do Supabase para Edge Functions.

---

## 3. Estrutura de pastas (monorepo simples)

```
barbersaas/
├── CLAUDE.md                     # instruções curtas para o Claude Code (ver seção 12)
├── ORIENTACAO-BARBERSAAS.md      # este documento
├── web/                          # Next.js
│   ├── app/
│   │   ├── (public)/b/[slug]/    # página pública do estabelecimento + fluxo de agendamento
│   │   ├── (app)/app/            # painel do estabelecimento (auth: owner/staff)
│   │   ├── (admin)/admin/        # painel da plataforma (auth: super_admin)
│   │   ├── api/webhooks/asaas/   # webhook de pagamentos
│   │   └── api/webhooks/whatsapp/
│   ├── components/
│   ├── lib/
│   │   ├── supabase/             # clients (browser, server, service-role)
│   │   ├── asaas.ts
│   │   └── whatsapp.ts
│   └── ...
├── supabase/
│   ├── migrations/               # SQL versionado (fonte da verdade do schema)
│   ├── functions/                # Edge Functions (Deno)
│   │   ├── asaas-webhook/
│   │   ├── enviar-lembretes/     # cron
│   │   └── suspender-inadimplentes/  # cron
│   └── seed.sql
└── README.md
```

---

## 4. Autenticação e papéis

Supabase Auth (e-mail/senha + OTP por telefone para cliente final).

Tabela `usuarios` (profile) ligada a `auth.users`, com papel global, e tabela de vínculo
`membros_estabelecimento` para papéis por tenant:

- `super_admin` — dono da plataforma (papel global em `usuarios.papel`).
- `owner` — dono do estabelecimento (em `membros_estabelecimento`).
- `staff` — profissional/recepção com acesso ao painel (em `membros_estabelecimento`).
- `cliente` — cliente final; vínculo é feito na tabela `clientes` (por `user_id` opcional + telefone).

**Cliente final não precisa criar conta para agendar** (fase 1: agenda informando nome + WhatsApp;
recebe link de gerenciamento com token). Conta com login vira recurso da fase 2/app.

---

## 5. Modelo de dados — Schema SQL completo

> Criar como migrations em `supabase/migrations/`, na ordem abaixo.
> Convenções: nomes em `snake_case` português; PK `uuid default gen_random_uuid()`;
> `created_at timestamptz default now()` em tudo; soft delete apenas onde indicado.

### 5.1 Tipos enumerados

```sql
create type papel_global as enum ('super_admin', 'usuario');
create type papel_membro as enum ('owner', 'staff');
create type status_estabelecimento as enum ('trial', 'ativa', 'inadimplente', 'suspensa', 'cancelada');
create type status_agendamento as enum ('pendente', 'confirmado', 'concluido', 'cancelado', 'no_show');
create type status_pagamento as enum ('pendente', 'pago', 'falhou', 'estornado', 'cancelado');
create type metodo_pagamento as enum ('pix', 'cartao', 'dinheiro', 'no_local', 'assinatura');
create type modo_cobranca as enum ('integral', 'sinal', 'no_local');
create type status_assinatura as enum ('ativa', 'inadimplente', 'cancelada', 'pausada');
```

### 5.2 Núcleo da plataforma

```sql
-- Perfil de usuário (espelha auth.users)
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  telefone text,
  papel papel_global not null default 'usuario',
  created_at timestamptz not null default now()
);

-- Planos que a PLATAFORMA vende para os estabelecimentos
create table planos_plataforma (
  id uuid primary key default gen_random_uuid(),
  nome text not null,                      -- ex: 'Essencial', 'Pro'
  preco_centavos int not null,
  max_profissionais int,                   -- null = ilimitado
  recursos jsonb not null default '{}',    -- flags: {"whatsapp": true, "relatorios": true}
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table estabelecimentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,               -- página pública /b/{slug}
  telefone_whatsapp text,
  descricao text,
  logo_url text,
  endereco jsonb,                          -- {rua, numero, bairro, cidade, uf, cep}
  timezone text not null default 'America/Sao_Paulo',
  status status_estabelecimento not null default 'trial',
  trial_ate date,
  plano_plataforma_id uuid references planos_plataforma(id),
  asaas_customer_id text,                  -- estabelecimento como CLIENTE da plataforma
  asaas_subconta_id text,                  -- estabelecimento como RECEBEDOR dos próprios clientes
  ativacao_manual boolean not null default false,  -- true = super_admin travou o status manualmente
  config jsonb not null default '{}',      -- {modo_cobranca_default, percentual_sinal, antecedencia_min_horas, ...}
  created_at timestamptz not null default now()
);

-- Assinatura do estabelecimento com a plataforma
create table assinaturas_plataforma (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  plano_plataforma_id uuid not null references planos_plataforma(id),
  status status_assinatura not null default 'ativa',
  gateway_subscription_id text,            -- id da assinatura no Asaas
  proximo_vencimento date,
  created_at timestamptz not null default now()
);

-- Vínculo usuário <-> estabelecimento (painel)
create table membros_estabelecimento (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  papel papel_membro not null default 'staff',
  unique (estabelecimento_id, usuario_id)
);
```

### 5.3 Domínio do estabelecimento (tudo com `estabelecimento_id`)

```sql
create table profissionais (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  usuario_id uuid references usuarios(id),        -- opcional: profissional com login
  nome text not null,
  foto_url text,
  comissao_percentual numeric(5,2) not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table servicos (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  nome text not null,                             -- ex: 'Corte masculino'
  descricao text,
  duracao_minutos int not null check (duracao_minutos > 0),
  preco_centavos int not null check (preco_centavos >= 0),
  categoria text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Quais serviços cada profissional executa
create table profissional_servicos (
  profissional_id uuid not null references profissionais(id) on delete cascade,
  servico_id uuid not null references servicos(id) on delete cascade,
  primary key (profissional_id, servico_id)
);

-- Jornada semanal do profissional (0 = domingo ... 6 = sábado)
create table jornadas (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  profissional_id uuid not null references profissionais(id) on delete cascade,
  dia_semana int not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fim time not null,
  check (hora_fim > hora_inicio)
);
-- Intervalos (almoço) = duas linhas de jornada no mesmo dia (ex: 09-12 e 13-19)

-- Bloqueios pontuais: folga, feriado, imprevisto (profissional_id null = estabelecimento inteiro)
create table bloqueios (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  profissional_id uuid references profissionais(id) on delete cascade,
  inicio timestamptz not null,
  fim timestamptz not null,
  motivo text,
  check (fim > inicio)
);

create table clientes (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  user_id uuid references usuarios(id),           -- preenchido quando o cliente cria conta (fase 2)
  nome text not null,
  telefone text not null,                          -- E.164: +5547999999999
  email text,
  observacoes text,
  token_acesso uuid not null default gen_random_uuid(),  -- link mágico de gerenciamento (fase 1)
  created_at timestamptz not null default now(),
  unique (estabelecimento_id, telefone)
);

-- Planos que o ESTABELECIMENTO vende para os clientes dele
create table planos_estabelecimento (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
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
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete cascade,
  plano_id uuid not null references planos_estabelecimento(id),
  status status_assinatura not null default 'ativa',
  gateway_subscription_id text,
  ciclo_inicio date not null,
  ciclo_fim date not null,
  usos_ciclo jsonb not null default '{}',          -- {"servico_id": 1} consumos no ciclo atual
  created_at timestamptz not null default now()
);

create table agendamentos (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  cliente_id uuid not null references clientes(id),
  profissional_id uuid not null references profissionais(id),
  servico_id uuid not null references servicos(id),
  inicio timestamptz not null,
  fim timestamptz not null,                        -- inicio + duracao do serviço (congelada no ato)
  status status_agendamento not null default 'pendente',
  origem text not null default 'online',           -- online | painel | whatsapp
  assinatura_cliente_id uuid references assinaturas_clientes(id),  -- se consumiu plano
  preco_centavos int not null,                     -- preço congelado no ato
  observacoes text,
  created_at timestamptz not null default now(),
  check (fim > inicio)
);
create index idx_agendamentos_agenda on agendamentos (estabelecimento_id, profissional_id, inicio);

-- Anti-overbooking no nível do banco (defesa final contra corrida):
alter table agendamentos add constraint agendamentos_sem_conflito
  exclude using gist (
    profissional_id with =,
    tstzrange(inicio, fim) with &&
  ) where (status in ('pendente', 'confirmado'));
-- requer: create extension if not exists btree_gist;

create table pagamentos (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
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
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  cliente_id uuid references clientes(id),
  agendamento_id uuid references agendamentos(id),
  tipo text not null,                              -- lembrete_24h | confirmacao | recuperacao | manual
  conteudo text,
  status text not null default 'enviada',          -- enviada | falhou
  created_at timestamptz not null default now()
);

-- Log de eventos de webhook (idempotência e auditoria)
create table webhook_eventos (
  id uuid primary key default gen_random_uuid(),
  origem text not null,                            -- asaas | whatsapp
  evento_id_externo text not null unique,          -- garante processamento único
  payload jsonb not null,
  processado_em timestamptz,
  created_at timestamptz not null default now()
);
```

### 5.4 Row Level Security (o coração do multi-tenant)

```sql
-- Habilitar RLS em TODAS as tabelas de domínio
alter table estabelecimentos enable row level security;
alter table profissionais enable row level security;
alter table servicos enable row level security;
alter table clientes enable row level security;
alter table agendamentos enable row level security;
-- (repetir para todas as demais tabelas com estabelecimento_id)

-- Funções auxiliares
create or replace function eh_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from usuarios where id = auth.uid() and papel = 'super_admin'
  );
$$;

create or replace function meus_estabelecimentos() returns setof uuid
language sql stable security definer set search_path = public as $$
  select estabelecimento_id from membros_estabelecimento where usuario_id = auth.uid();
$$;

-- Padrão de políticas (exemplo com 'servicos'; replicar o padrão nas demais):
create policy "membros leem" on servicos for select
  using (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin());

create policy "membros escrevem" on servicos for all
  using (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin())
  with check (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin());

-- Página pública: leitura anônima APENAS do necessário para agendar,
-- e somente de estabelecimentos ativos/trial:
create policy "publico ve servicos de estabelecimento ativo" on servicos for select
  to anon using (
    ativo and exists (
      select 1 from estabelecimentos e
      where e.id = servicos.estabelecimento_id and e.status in ('ativa', 'trial')
    )
  );
-- Replicar padrão público para: estabelecimentos (select por slug), profissionais, planos_estabelecimento, jornadas.

-- Clientes/agendamentos NUNCA têm leitura anônima direta.
-- Criação de agendamento público e consulta por token_acesso acontecem via RPC security definer
-- ou Edge Function com service role, com validação explícita.
```

### 5.5 RPC de disponibilidade (função mais crítica do sistema)

```sql
-- Retorna slots livres de um profissional para um serviço em uma data.
-- Disponibilidade = jornada do dia − bloqueios − agendamentos (pendente/confirmado),
-- em passos de 15 min (configurável), respeitando duração do serviço,
-- antecedência mínima e timezone do estabelecimento.
create or replace function slots_disponiveis(
  p_estabelecimento_id uuid,
  p_profissional_id uuid,
  p_servico_id uuid,
  p_data date
) returns table (inicio timestamptz, fim timestamptz)
language plpgsql stable security definer set search_path = public as $$
-- Implementar com generate_series sobre a jornada do dia, subtraindo interseções.
-- REGRAS OBRIGATÓRIAS:
--   1. Converter p_data para o timezone do estabelecimento antes de montar os horários.
--   2. Excluir slots que colidam com tstzrange de agendamentos pendente/confirmado.
--   3. Excluir slots dentro de bloqueios (do profissional OU do estabelecimento inteiro).
--   4. Excluir slots no passado e dentro da antecedência mínima (config do estabelecimento).
--   5. O slot só é válido se slot_inicio + duracao_servico couber antes do fim da jornada.
$$;
```

**Exigência de teste:** esta função deve ter testes SQL (pgTAP ou script de verificação em `supabase/tests/`)
cobrindo: almoço, dois agendamentos seguidos, bloqueio parcial, serviço de 45 min em jornada que fecha 19h,
horário de verão/timezone e agendamento simultâneo (constraint de exclusão deve barrar).

---

## 6. Fluxos de negócio

### 6.1 Billing da plataforma (estabelecimento paga o dono da plataforma)

1. Estabelecimento se cadastra → status `trial` (14 dias, `trial_ate` preenchido).
2. Ao assinar: cria customer + assinatura no Asaas → grava `gateway_subscription_id`.
3. **Webhook Asaas** (`/api/webhooks/asaas` ou Edge Function):
   - `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` → se `ativacao_manual = false`, status → `ativa`. **Ativação automática.**
   - `PAYMENT_OVERDUE` → status → `inadimplente` (estabelecimento continua funcionando, com aviso no painel).
4. **Cron diário** (`suspender-inadimplentes`): inadimplente há mais de **5 dias de carência** → `suspensa`.
   - `suspensa`: página pública sai do ar (RLS já bloqueia via status), painel em modo somente-leitura com tela de regularização.
5. **Controle manual (super_admin):** botão ativar/desativar no `/admin` seta o status e `ativacao_manual = true`
   (webhooks passam a não alterar o status até o super_admin destravar). Atende o requisito de ativação/desativação manual.

Idempotência: todo webhook grava primeiro em `webhook_eventos` (unique em `evento_id_externo`); se já existe, ignora.

### 6.2 Pagamento do cliente para o estabelecimento

- Cada estabelecimento tem **subconta Asaas** (`asaas_subconta_id`) criada no onboarding → dinheiro cai direto para ela.
- A plataforma pode configurar **split** (taxa por transação) — segunda fonte de receita, além da mensalidade.
- Modos por estabelecimento (`config.modo_cobranca_default`, sobrescrevível por serviço):
  - `integral` — paga tudo ao agendar (Pix ou cartão).
  - `sinal` — paga X% ao agendar (arma anti-no-show), resto no local.
  - `no_local` — só reserva.
- Fluxo online: cria `agendamento (pendente)` + `pagamento (pendente)` + cobrança Pix no Asaas → exibe QR Code →
  webhook confirma → `pagamento.pago` + `agendamento.confirmado` + WhatsApp de confirmação.
- **Expiração:** agendamento `pendente` com pagamento não confirmado em 15 min → cancelar e liberar o slot (cron ou `pg_cron`).

### 6.3 Assinatura do cliente no estabelecimento (ex: "Clube do Corte")

1. Cliente assina plano na página pública → assinatura recorrente na subconta Asaas do estabelecimento.
2. Ao agendar, se há assinatura ativa cobrindo o serviço e saldo no ciclo (`usos_ciclo` vs `regras`),
   o agendamento sai **sem cobrança** e incrementa `usos_ciclo`.
3. Renovação (webhook) → zera `usos_ciclo`, atualiza `ciclo_inicio/fim`. Falha de pagamento → `inadimplente` → benefícios pausam.
4. Cancelamento de agendamento que consumiu plano → devolve o uso.

### 6.4 WhatsApp

**Fase 1 (MVP):**
- Confirmação pós-agendamento e lembrete via **WhatsApp Cloud API** (templates aprovados: `confirmacao_agendamento`, `lembrete_24h`).
- Cron `enviar-lembretes` (a cada 30 min): busca agendamentos confirmados entre 23h30 e 24h30 à frente sem lembrete enviado → envia → loga em `mensagens_whatsapp`.
- Botão "Chamar no WhatsApp" na página pública = link `wa.me/{telefone}?text=...` (custo zero).

**Fase 3:** bot conversacional de agendamento (webhook de mensagens recebidas + API da Anthropic para interpretar
a intenção e conduzir o fluxo consultando `slots_disponiveis`). Diferencial competitivo — não construir antes do core estar sólido.

### 6.5 Cancelamento e no-show

- Cliente pode cancelar/remarcar pelo link com `token_acesso` até N horas antes (config do estabelecimento, default 2h).
- Painel marca `no_show`; relatório de no-show por cliente permite exigir sinal de clientes reincidentes.

---

## 7. Páginas e telas por aplicação

### Página pública `/b/{slug}` (mobile-first — maioria dos acessos será celular)
1. Home do estabelecimento: logo, descrição, endereço, serviços com preço, profissionais, avaliações (fase 2).
2. Fluxo de agendamento: serviço → profissional (ou "qualquer") → data/horário (via `slots_disponiveis`) → nome + WhatsApp → pagamento (conforme modo) → confirmação.
3. Página de gerenciamento via token: ver/cancelar/remarcar agendamento.
4. Página do plano de assinatura do estabelecimento (fase 2).

### Painel do estabelecimento `/app`
1. **Agenda** (visão dia/semana, por profissional, drag para reagendar) — tela principal.
2. Agendamento manual (cliente de balcão/telefone).
3. Clientes (lista, histórico, "sumidos há X dias").
4. Serviços, Profissionais (com jornadas), Bloqueios/folgas.
5. Planos de assinatura + assinantes.
6. Financeiro: pagamentos, comissões por profissional (fase 2).
7. Configurações: dados da página, modo de cobrança, antecedência, WhatsApp.
8. Tela de regularização quando `suspensa`.

### Painel admin `/admin`
1. Lista de estabelecimentos com status e MRR.
2. Detalhe: ativar/desativar manual (trava `ativacao_manual`), histórico de pagamentos, impersonate (fase 2).
3. Planos da plataforma (CRUD).
4. Métricas: MRR, churn, estabelecimentos ativos/trial/inadimplentes.

---

## 8. Roadmap por fases (ordem de implementação no Claude Code)

### Fase 0 — Fundação
- [ ] Monorepo, Next.js + TS + Tailwind, Supabase local (`supabase init`), CI básico (lint + typecheck).
- [ ] Migrations: enums, tabelas núcleo (5.2), domínio (5.3), extensão `btree_gist`, RLS (5.4), seed com 1 estabelecimento demo.

### Fase 1 — MVP vendável
- [ ] Auth + onboarding do estabelecimento (cria estabelecimento, vira `owner`, trial 14 dias).
- [ ] CRUD: serviços, profissionais (+ jornadas + vínculo serviço), bloqueios, clientes.
- [ ] RPC `slots_disponiveis` + testes.
- [ ] Página pública com fluxo de agendamento completo (modo `no_local`).
- [ ] Agenda do painel (dia/semana) + agendamento manual + cancelar/concluir/no-show.
- [ ] Billing da plataforma: Asaas (customer + assinatura), webhook, ativação automática, cron de suspensão, controle manual no `/admin`.
- [ ] WhatsApp: confirmação + lembrete 24h (Cloud API) + links wa.me.
- [ ] Painel admin mínimo (lista, status, ativar/desativar).

### Fase 2 — Monetização do estabelecimento
- [ ] Subcontas Asaas + split; pagamento no agendamento (integral/sinal, Pix + QR Code, expiração de pendentes).
- [ ] Planos de assinatura do estabelecimento + consumo de usos no agendamento.
- [ ] Financeiro: relatórios de faturamento e comissões.
- [ ] Recuperação de clientes sumidos; avaliação pós-atendimento; fidelidade (contador de cortes).
- [ ] Login do cliente final (conta unificada por telefone).

### Fase 3 — Expansão
- [ ] App mobile Expo (cliente final primeiro; painel depois).
- [ ] Bot de agendamento via WhatsApp com IA.
- [ ] Lista de espera/encaixe; multi-unidade (rede de estabelecimentos).

---

## 9. Variáveis de ambiente

```
# web/.env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # só no server; NUNCA exposto ao client
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=              # validar header de autenticidade do webhook
WHATSAPP_CLOUD_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
NEXT_PUBLIC_APP_URL=
```

Sandbox do Asaas em dev; secrets das Edge Functions via `supabase secrets set`.

---

## 10. Convenções de código

- TypeScript estrito; tipos do banco gerados com `supabase gen types typescript` em `web/lib/supabase/types.ts`.
- Dinheiro sempre em **centavos (int)**; formatação BRL só na UI.
- Telefones em E.164 (`+55...`); normalizar na entrada.
- Nomes de tabelas/colunas em português `snake_case`; código TS em inglês, textos de UI em pt-BR.
- Validação com Zod em toda entrada de API/route handler.
- Commits pequenos e frequentes; uma feature por branch quando fizer sentido.

## 11. Segurança (checklist permanente)

- RLS habilitado em toda tabela nova — sem exceção. Teste de isolamento: usuário do estabelecimento A não lê nada do B.
- `service_role` apenas em server/Edge Functions; jamais no bundle do client.
- Webhooks: validar token/assinatura + idempotência via `webhook_eventos`.
- Entradas públicas (agendamento anônimo) com rate limit e validação server-side de slot (a constraint `agendamentos_sem_conflito` é a última barreira, não a única).
- `token_acesso` do cliente: tratar como credencial (não logar, permitir regenerar).

## 12. CLAUDE.md sugerido (criar na raiz do repo)

```markdown
# BarberSaaS

SaaS multi-tenant para barbearias e salões de beleza. Leia ORIENTACAO-BARBERSAAS.md antes de qualquer tarefa.

## Regras
- Multi-tenant por estabelecimento_id + RLS. Toda tabela nova: coluna estabelecimento_id + políticas RLS + teste de isolamento.
- Dinheiro em centavos (int). Datas em timestamptz UTC; timezone do estabelecimento na exibição.
- Pagamentos/ativações só mudam de status via webhook idempotente (webhook_eventos).
- Nunca usar service_role no client. Nunca commitar .env.
- Schema muda só via supabase/migrations (nunca editar o banco direto).

## Comandos
- `cd web && npm run dev` — Next.js
- `supabase start` / `supabase db reset` — banco local + migrations + seed
- `cd web && npm run lint && npm run typecheck` — rodar antes de finalizar qualquer tarefa

## Estado atual
- Fase: 0 (fundação). Próxima tarefa: ver checklist da Fase 0 na ORIENTACAO.
```

---

## 13. Informações pendentes (responder antes/durante a Fase 1)

1. **Nome do produto** BarberSaaS
2. **Preço da assinatura da plataforma** Colocar opção de várias assinaturas ou pacote, mas de inicio valor que achar viavel e competitivo com a comcorrencia. 
3. **Gateway:** pagamento igual foi feito no SantoPlay, via pix e parcelamento do mercado livre, ou painel de cofiguração para usar Assas
4. **WhatsApp Cloud API:** Deixa para última etapa
5. Página pública em **path** (`plataforma.com/b/slug`) ou **subdomínio** (`slug.plataforma.com`)? Recomendo path no MVP (subdomínio exige wildcard DNS/SSL).


Dados de acesso do Supabase
https://smphmeoljjgakghsnvpb.supabase.co

Chave publica: sb_publishable_CVweKnAmbsBvRWEYmLjcBw_RoiExHpa

postgresql://postgres:[YOUR-PASSWORD]@db.smphmeoljjgakghsnvpb.supabase.co:5432/postgres (Senha: Ronison@9213)

supabase login
supabase init
supabase link --project-ref smphmeoljjgakghsnvpb
