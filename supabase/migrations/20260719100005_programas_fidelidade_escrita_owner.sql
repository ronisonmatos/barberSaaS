-- Regras de fidelidade sao configuracao de negocio sensivel (quantos selos, qual o brinde) --
-- mesmo criterio ja usado pra estabelecimento_pagamento_config/membros_estabelecimento: so o
-- owner escreve, staff so le. Leitura continua liberada pra qualquer membro (a tela operacional
-- /app/fidelidade, aberta a staff, precisa ler o programa pra mostrar nome/selos_necessarios).

drop policy "membros escrevem programas_fidelidade" on programas_fidelidade;

create policy "owner escreve programas_fidelidade" on programas_fidelidade for all
  using (estabelecimento_id in (select estabelecimentos_que_possuo()) or eh_super_admin())
  with check (estabelecimento_id in (select estabelecimentos_que_possuo()) or eh_super_admin());
