-- Decisao do usuario: qualquer funcionario pode cadastrar um cliente VIP e configurar o horario
-- fixo dele, mas so na PROPRIA agenda (profissional vinculado a propria conta via
-- profissionais.usuario_id); o dono pode vincular em qualquer agenda de profissional. A restricao
-- de "so a propria agenda" nao da pra expressar direito numa policy de RLS (precisaria comparar
-- profissional_id com o profissional vinculado ao usuario logado, o que e responsabilidade da
-- action em web/app/(app)/app/assinaturas/actions-horario-fixo.ts) -- entao a RLS aqui so
-- precisa deixar de ser owner-only e virar o padrao geral de "qualquer membro do estabelecimento"
-- (mesmo criterio de agendamentos/clientes/profissionais), com a regra fina de "so a propria
-- agenda" sendo aplicada em codigo.
drop policy "owners escrevem horarios fixos" on assinatura_horarios_fixos;

create policy "membros escrevem horarios fixos" on assinatura_horarios_fixos for all
  using (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin())
  with check (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin());
