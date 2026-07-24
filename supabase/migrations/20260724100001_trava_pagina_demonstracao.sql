-- Paginas de demonstracao (Carlos Andrady, Encanto Studio) precisam deixar o fluxo publico
-- (agendar, comprar na loja, assinar o clube) rodar por inteiro pra gravar video/mostrar pro
-- cliente em potencial -- inclusive o passo de pagamento, ja que Encanto Studio usa credenciais
-- reais de gateway (copiadas do Clube do Homem de proposito). O que nao pode acontecer e' o
-- agendamento/pedido/assinatura ser CONCLUIDO de verdade (o que geraria cobranca real numa
-- conta real por um servico que nunca vai existir).
--
-- "rascunho" ja cobre demonstracoes ainda nao reivindicadas, mas uma demonstracao pode ser
-- promovida a "pagina ativa" (ver Encanto Studio) sem deixar de ser fake -- por isso um flag
-- novo e independente, que nao expira e nao se confunde com o ciclo de reivindicacao.
alter table estabelecimentos add column if not exists pagina_demonstracao boolean not null default false;

create or replace function assert_nao_e_pagina_demonstracao(p_estabelecimento_id uuid) returns void
language plpgsql stable as $$
declare
  v_demo boolean;
begin
  select (rascunho or pagina_demonstracao) into v_demo from estabelecimentos where id = p_estabelecimento_id;
  if coalesce(v_demo, false) then
    raise exception 'Esta e uma pagina de demonstracao -- agendamentos, pedidos e assinaturas nao sao processados de verdade aqui.';
  end if;
end;
$$;

-- Trigger (nao um patch dentro de cada RPC publica): cobre criar_agendamento_publico(_pix),
-- criar_pedido_publico(_pix), criar_assinatura_publica_pix e qualquer caminho futuro que insira
-- nessas 3 tabelas, sem precisar reproduzir o corpo inteiro de cada funcao (algumas ja levaram
-- varias migrations de ajuste fino, risco alto de regressao ao copiar a mao).
create or replace function trigger_bloquear_pagina_demonstracao() returns trigger
language plpgsql as $$
begin
  perform assert_nao_e_pagina_demonstracao(new.estabelecimento_id);
  return new;
end;
$$;

drop trigger if exists bloquear_demonstracao_agendamentos on agendamentos;
create trigger bloquear_demonstracao_agendamentos
  before insert on agendamentos
  for each row execute function trigger_bloquear_pagina_demonstracao();

drop trigger if exists bloquear_demonstracao_pedidos on pedidos;
create trigger bloquear_demonstracao_pedidos
  before insert on pedidos
  for each row execute function trigger_bloquear_pagina_demonstracao();

drop trigger if exists bloquear_demonstracao_assinaturas on assinaturas_clientes;
create trigger bloquear_demonstracao_assinaturas
  before insert on assinaturas_clientes
  for each row execute function trigger_bloquear_pagina_demonstracao();

update estabelecimentos set pagina_demonstracao = true where slug = 'encanto-studio';
