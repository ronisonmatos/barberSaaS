-- Cliente VIP com horario fixo dentro do Clube de assinatura: o estabelecimento configura, por
-- assinatura ativa, um servico/profissional/horario que se repete a cada N dias. Atrelado ao
-- clube (nao um recurso independente) -- decisao explicita do usuario: cada ocorrencia gerada
-- automaticamente consome uma unidade da cota mensal do plano, reaproveitando exatamente a mesma
-- logica de assinatura_disponivel_para_servico/usos_ciclo ja usada no agendamento normal.
--
-- Escrita restrita a owner (mesma regua ja aplicada em planos_estabelecimento e em
-- cancelarAssinatura): mexe em algo que consome cota paga automaticamente, sem confirmacao do
-- cliente a cada ciclo.
create table assinatura_horarios_fixos (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  assinatura_cliente_id uuid not null unique references assinaturas_clientes(id) on delete cascade,
  servico_id uuid not null references servicos(id),
  profissional_id uuid not null references profissionais(id),
  intervalo_dias int not null check (intervalo_dias > 0),
  horario time not null,
  proxima_data date not null,
  reservar_automaticamente boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_assinatura_horarios_fixos_geracao
  on assinatura_horarios_fixos (proxima_data)
  where ativo and reservar_automaticamente;

alter table assinatura_horarios_fixos enable row level security;

create policy "membros leem horarios fixos" on assinatura_horarios_fixos for select
  using (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin());

create policy "owners escrevem horarios fixos" on assinatura_horarios_fixos for all
  using (estabelecimento_id in (select estabelecimentos_que_possuo()) or eh_super_admin())
  with check (estabelecimento_id in (select estabelecimentos_que_possuo()) or eh_super_admin());
