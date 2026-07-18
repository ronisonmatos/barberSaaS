-- Restringe a agenda: um membro staff vinculado a um profissional (profissionais.usuario_id)
-- so ve/edita os agendamentos daquele profissional. O dono continua vendo tudo. Staff sem
-- vinculo ainda ve tudo (comportamento antigo preservado) ate o dono vincular a conta em
-- /app/profissionais -- evita quebrar contas ja em uso hoje sem esse vinculo configurado.

create unique index profissionais_usuario_id_unique on profissionais (usuario_id) where usuario_id is not null;

create or replace function meu_profissional_id(p_estabelecimento_id uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select id from profissionais
  where estabelecimento_id = p_estabelecimento_id and usuario_id = auth.uid()
  limit 1;
$$;

drop policy "membros leem agendamentos" on agendamentos;
create policy "membros leem agendamentos" on agendamentos for select
  using (
    eh_super_admin()
    or (
      estabelecimento_id in (select meus_estabelecimentos())
      and (
        estabelecimento_id in (select estabelecimentos_que_possuo())
        or meu_profissional_id(estabelecimento_id) is null
        or profissional_id = meu_profissional_id(estabelecimento_id)
      )
    )
  );

drop policy "membros escrevem agendamentos" on agendamentos;
create policy "membros escrevem agendamentos" on agendamentos for all
  using (
    eh_super_admin()
    or (
      estabelecimento_id in (select meus_estabelecimentos())
      and (
        estabelecimento_id in (select estabelecimentos_que_possuo())
        or meu_profissional_id(estabelecimento_id) is null
        or profissional_id = meu_profissional_id(estabelecimento_id)
      )
    )
  )
  with check (
    eh_super_admin()
    or (
      estabelecimento_id in (select meus_estabelecimentos())
      and (
        estabelecimento_id in (select estabelecimentos_que_possuo())
        or meu_profissional_id(estabelecimento_id) is null
        or profissional_id = meu_profissional_id(estabelecimento_id)
      )
    )
  );
