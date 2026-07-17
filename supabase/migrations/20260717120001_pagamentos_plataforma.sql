-- Cobranca da assinatura do estabelecimento com a PLATAFORMA (Comptus), separada dos pagamentos
-- que o cliente final faz para o estabelecimento (tabela `pagamentos`). Reaproveita os enums
-- metodo_pagamento/status_pagamento e a tabela `assinaturas_plataforma` ja existente desde a
-- fundacao (nunca usada ate agora).

create table pagamentos_plataforma (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  plano_plataforma_id uuid not null references planos_plataforma(id),
  valor_centavos int not null,
  metodo metodo_pagamento not null,
  status status_pagamento not null default 'pendente',
  gateway_payment_id text,
  pago_em timestamptz,
  created_at timestamptz not null default now()
);

create index idx_pagamentos_plataforma_estabelecimento on pagamentos_plataforma (estabelecimento_id);

alter table pagamentos_plataforma enable row level security;

-- Leitura: dono do estabelecimento ou super_admin. Escrita: NAO existe policy pra authenticated --
-- criacao da cobranca (chama o Mercado Pago) e confirmacao (webhook) só acontecem via
-- service_role no servidor, mesma filosofia da tabela `pagamentos` (nunca escrita direta do client).
create policy "owner le pagamentos da plataforma" on pagamentos_plataforma for select
  using (
    estabelecimento_id in (
      select estabelecimento_id from membros_estabelecimento
      where usuario_id = auth.uid() and papel = 'owner'
    ) or eh_super_admin()
  );
