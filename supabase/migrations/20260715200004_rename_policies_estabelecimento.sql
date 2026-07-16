-- Rename "barbearia" -> "estabelecimento": nomes de politicas RLS. Os corpos USING/CHECK
-- ja acompanharam o rename de tabela/coluna automaticamente (Postgres rastreia por OID),
-- entao aqui so o nome textual da politica precisa ser corrigido.

alter policy "membros leem propria barbearia" on estabelecimentos rename to "membros leem proprio estabelecimento";
alter policy "membros escrevem propria barbearia" on estabelecimentos rename to "membros escrevem proprio estabelecimento";
alter policy "usuario autenticado cria barbearia" on estabelecimentos rename to "usuario autenticado cria estabelecimento";
alter policy "publico ve barbearia ativa" on estabelecimentos rename to "publico ve estabelecimento ativo";

alter policy "membros leem vinculos da propria barbearia" on membros_estabelecimento rename to "membros leem vinculos do proprio estabelecimento";
alter policy "owners gerenciam vinculos da propria barbearia" on membros_estabelecimento rename to "owners gerenciam vinculos do proprio estabelecimento";

alter policy "publico ve profissionais de barbearia ativa" on profissionais rename to "publico ve profissionais de estabelecimento ativo";

alter policy "publico ve servicos de barbearia ativa" on servicos rename to "publico ve servicos de estabelecimento ativo";

alter policy "publico ve profissional_servicos de barbearia ativa" on profissional_servicos rename to "publico ve profissional_servicos de estabelecimento ativo";

alter policy "publico ve jornadas de barbearia ativa" on jornadas rename to "publico ve jornadas de estabelecimento ativo";

alter policy "membros leem planos_barbearia" on planos_estabelecimento rename to "membros leem planos_estabelecimento";
alter policy "membros escrevem planos_barbearia" on planos_estabelecimento rename to "membros escrevem planos_estabelecimento";
alter policy "publico ve planos_barbearia de barbearia ativa" on planos_estabelecimento rename to "publico ve planos_estabelecimento de estabelecimento ativo";
