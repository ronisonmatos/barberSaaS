-- fidelidade_status_cliente so retornava linhas de cartoes_fidelidade ja existentes -- ou seja,
-- o cliente so via qualquer coisa depois da primeira visita CONCLUIDA daquele servico. Usuario
-- pediu pra ele ficar sabendo "automaticamente" que esta participando assim que agenda o
-- servico, mesmo antes de ter selo nenhum. Passa a incluir uma entrada "virtual" (0 selos) pra
-- todo programa ativo cujo servico o cliente ja tenha AGENDADO (independente de status) e que
-- ainda nao tenha cartao — nao mexe na concessao de selo em si (continua so em 'concluido'),
-- e um efeito puramente informativo/de leitura.

create or replace function fidelidade_status_cliente(p_cliente_id uuid) returns table (
  cartao_id uuid,
  programa_nome text,
  brinde text,
  selos_atual int,
  selos_necessarios int,
  status text
) language sql stable security definer set search_path = public as $$
  with combinado as (
    select
      c.id as cartao_id,
      p.nome as programa_nome,
      case when p.brinde_tipo = 'servico' then s.nome else pr.nome end as brinde,
      c.selos_atual as selos_atual,
      p.selos_necessarios as selos_necessarios,
      c.status as status
    from cartoes_fidelidade c
    join programas_fidelidade p on p.id = c.programa_id
    left join servicos s on s.id = p.brinde_servico_id
    left join produtos pr on pr.id = p.brinde_produto_id
    where c.cliente_id = p_cliente_id
      and c.status in ('em_andamento', 'completo')

    union all

    select
      null::uuid as cartao_id,
      p.nome as programa_nome,
      case when p.brinde_tipo = 'servico' then s.nome else pr.nome end as brinde,
      0 as selos_atual,
      p.selos_necessarios as selos_necessarios,
      'em_andamento' as status
    from programas_fidelidade p
    left join servicos s on s.id = p.brinde_servico_id
    left join produtos pr on pr.id = p.brinde_produto_id
    where p.ativo
      and p.estabelecimento_id = (select cl.estabelecimento_id from clientes cl where cl.id = p_cliente_id)
      and exists (select 1 from agendamentos a where a.cliente_id = p_cliente_id and a.servico_id = p.servico_id)
      and not exists (select 1 from cartoes_fidelidade c2 where c2.cliente_id = p_cliente_id and c2.programa_id = p.id)
  )
  select * from combinado
  order by case status when 'completo' then 0 when 'em_andamento' then 1 else 2 end, programa_nome;
$$;
