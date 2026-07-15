-- Fase 0: Row Level Security (ORIENTACAO-BARBERSAAS.md secao 5.4)
-- Coracao do isolamento multi-tenant. Toda tabela de dominio tem RLS habilitado.

-- ============================================================
-- Funcoes auxiliares
-- ============================================================

create or replace function eh_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from usuarios where id = auth.uid() and papel = 'super_admin'
  );
$$;

create or replace function minhas_barbearias() returns setof uuid
language sql stable security definer set search_path = public as $$
  select barbearia_id from membros_barbearia where usuario_id = auth.uid();
$$;

-- ============================================================
-- usuarios (perfil global)
-- ============================================================

alter table usuarios enable row level security;

create policy "usuario le proprio perfil" on usuarios for select
  using (id = auth.uid() or eh_super_admin());

create policy "usuario atualiza proprio perfil" on usuarios for update
  using (id = auth.uid() or eh_super_admin())
  with check (id = auth.uid() or eh_super_admin());

create policy "usuario autenticado cria proprio perfil" on usuarios for insert
  with check (id = auth.uid());

-- ============================================================
-- planos_plataforma (catalogo publico de planos da plataforma)
-- ============================================================

alter table planos_plataforma enable row level security;

create policy "qualquer um le planos ativos" on planos_plataforma for select
  using (ativo or eh_super_admin());

create policy "super_admin escreve planos" on planos_plataforma for insert
  with check (eh_super_admin());

create policy "super_admin atualiza planos" on planos_plataforma for update
  using (eh_super_admin())
  with check (eh_super_admin());

create policy "super_admin remove planos" on planos_plataforma for delete
  using (eh_super_admin());

-- ============================================================
-- barbearias
-- ============================================================

alter table barbearias enable row level security;

create policy "membros leem propria barbearia" on barbearias for select
  using (id in (select minhas_barbearias()) or eh_super_admin());

create policy "membros escrevem propria barbearia" on barbearias for update
  using (id in (select minhas_barbearias()) or eh_super_admin())
  with check (id in (select minhas_barbearias()) or eh_super_admin());

create policy "usuario autenticado cria barbearia" on barbearias for insert
  with check (auth.uid() is not null);

create policy "publico ve barbearia ativa" on barbearias for select
  to anon using (status in ('ativa', 'trial'));

-- ============================================================
-- assinaturas_plataforma
-- ============================================================

alter table assinaturas_plataforma enable row level security;

create policy "membros leem assinatura plataforma" on assinaturas_plataforma for select
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

create policy "somente super_admin escreve assinatura plataforma" on assinaturas_plataforma for all
  using (eh_super_admin())
  with check (eh_super_admin());

-- ============================================================
-- membros_barbearia
-- ============================================================

alter table membros_barbearia enable row level security;

create policy "membros leem vinculos da propria barbearia" on membros_barbearia for select
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

create policy "owners gerenciam vinculos da propria barbearia" on membros_barbearia for all
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin())
  with check (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

-- ============================================================
-- profissionais
-- ============================================================

alter table profissionais enable row level security;

create policy "membros leem profissionais" on profissionais for select
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

create policy "membros escrevem profissionais" on profissionais for all
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin())
  with check (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

create policy "publico ve profissionais de barbearia ativa" on profissionais for select
  to anon using (
    ativo and exists (
      select 1 from barbearias b
      where b.id = profissionais.barbearia_id and b.status in ('ativa', 'trial')
    )
  );

-- ============================================================
-- servicos
-- ============================================================

alter table servicos enable row level security;

create policy "membros leem servicos" on servicos for select
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

create policy "membros escrevem servicos" on servicos for all
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin())
  with check (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

create policy "publico ve servicos de barbearia ativa" on servicos for select
  to anon using (
    ativo and exists (
      select 1 from barbearias b
      where b.id = servicos.barbearia_id and b.status in ('ativa', 'trial')
    )
  );

-- ============================================================
-- profissional_servicos (sem barbearia_id direto; isola via join)
-- ============================================================

alter table profissional_servicos enable row level security;

create policy "membros leem profissional_servicos" on profissional_servicos for select
  using (
    exists (
      select 1 from profissionais p
      where p.id = profissional_servicos.profissional_id
        and (p.barbearia_id in (select minhas_barbearias()) or eh_super_admin())
    )
  );

create policy "membros escrevem profissional_servicos" on profissional_servicos for all
  using (
    exists (
      select 1 from profissionais p
      where p.id = profissional_servicos.profissional_id
        and (p.barbearia_id in (select minhas_barbearias()) or eh_super_admin())
    )
  )
  with check (
    exists (
      select 1 from profissionais p
      where p.id = profissional_servicos.profissional_id
        and (p.barbearia_id in (select minhas_barbearias()) or eh_super_admin())
    )
  );

create policy "publico ve profissional_servicos de barbearia ativa" on profissional_servicos for select
  to anon using (
    exists (
      select 1 from profissionais p
      join barbearias b on b.id = p.barbearia_id
      where p.id = profissional_servicos.profissional_id
        and p.ativo and b.status in ('ativa', 'trial')
    )
  );

-- ============================================================
-- jornadas
-- ============================================================

alter table jornadas enable row level security;

create policy "membros leem jornadas" on jornadas for select
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

create policy "membros escrevem jornadas" on jornadas for all
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin())
  with check (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

create policy "publico ve jornadas de barbearia ativa" on jornadas for select
  to anon using (
    exists (
      select 1 from barbearias b
      where b.id = jornadas.barbearia_id and b.status in ('ativa', 'trial')
    )
  );

-- ============================================================
-- bloqueios
-- ============================================================

alter table bloqueios enable row level security;

create policy "membros leem bloqueios" on bloqueios for select
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

create policy "membros escrevem bloqueios" on bloqueios for all
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin())
  with check (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

-- ============================================================
-- clientes (NUNCA leitura anonima direta)
-- ============================================================

alter table clientes enable row level security;

create policy "membros leem clientes" on clientes for select
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

create policy "membros escrevem clientes" on clientes for all
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin())
  with check (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

-- ============================================================
-- planos_barbearia
-- ============================================================

alter table planos_barbearia enable row level security;

create policy "membros leem planos_barbearia" on planos_barbearia for select
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

create policy "membros escrevem planos_barbearia" on planos_barbearia for all
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin())
  with check (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

create policy "publico ve planos_barbearia de barbearia ativa" on planos_barbearia for select
  to anon using (
    ativo and exists (
      select 1 from barbearias b
      where b.id = planos_barbearia.barbearia_id and b.status in ('ativa', 'trial')
    )
  );

-- ============================================================
-- assinaturas_clientes (NUNCA leitura anonima direta)
-- ============================================================

alter table assinaturas_clientes enable row level security;

create policy "membros leem assinaturas_clientes" on assinaturas_clientes for select
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

create policy "membros escrevem assinaturas_clientes" on assinaturas_clientes for all
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin())
  with check (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

-- ============================================================
-- agendamentos (NUNCA leitura anonima direta)
-- ============================================================

alter table agendamentos enable row level security;

create policy "membros leem agendamentos" on agendamentos for select
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

create policy "membros escrevem agendamentos" on agendamentos for all
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin())
  with check (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

-- ============================================================
-- pagamentos (NUNCA leitura anonima direta)
-- ============================================================

alter table pagamentos enable row level security;

create policy "membros leem pagamentos" on pagamentos for select
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

create policy "somente super_admin e membros gerenciam pagamentos" on pagamentos for all
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin())
  with check (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

-- ============================================================
-- mensagens_whatsapp
-- ============================================================

alter table mensagens_whatsapp enable row level security;

create policy "membros leem mensagens_whatsapp" on mensagens_whatsapp for select
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

create policy "membros escrevem mensagens_whatsapp" on mensagens_whatsapp for all
  using (barbearia_id in (select minhas_barbearias()) or eh_super_admin())
  with check (barbearia_id in (select minhas_barbearias()) or eh_super_admin());

-- ============================================================
-- webhook_eventos: nenhuma policy para authenticated/anon.
-- Somente service_role (Edge Functions) le/escreve, que ignora RLS por padrao.
-- ============================================================

alter table webhook_eventos enable row level security;
