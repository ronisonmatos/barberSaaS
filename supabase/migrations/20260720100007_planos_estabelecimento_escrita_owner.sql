-- Planos do clube de assinatura sao configuracao de negocio sensivel (preco, quantas visitas por
-- mes) -- mesmo criterio ja usado em programas_fidelidade (20260719100005): so o owner escreve,
-- staff so le. Leitura continua liberada pra qualquer membro.

drop policy "membros escrevem planos_estabelecimento" on planos_estabelecimento;

create policy "owner escreve planos_estabelecimento" on planos_estabelecimento for all
  using (estabelecimento_id in (select estabelecimentos_que_possuo()) or eh_super_admin())
  with check (estabelecimento_id in (select estabelecimentos_que_possuo()) or eh_super_admin());
