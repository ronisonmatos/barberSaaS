-- Cliente precisa saber, JA no wizard de agendamento, que o servico escolhido participa do
-- cartao fidelidade -- mesmo antes de ter qualquer selo (e informacao do PROGRAMA, nao do
-- progresso individual, entao nao precisa resolver identidade do cliente). Ate agora
-- programas_fidelidade so tinha policy pra membros (leva 1, "sem fluxo publico"); esta migration
-- abre leitura publica condicionada a estabelecimento ativo + gate de plano, mesmo padrao ja
-- usado em produtos (20260717150002_gate_loja_por_plano.sql).

create policy "publico ve programas_fidelidade de estabelecimento ativo" on programas_fidelidade for select
  to anon using (
    ativo and estabelecimento_permite_fidelidade(estabelecimento_id) and exists (
      select 1 from estabelecimentos e
      where e.id = programas_fidelidade.estabelecimento_id and e.status in ('ativa', 'trial')
    )
  );
