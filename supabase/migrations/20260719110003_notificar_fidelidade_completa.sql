-- Estende atualizar_status_agendamento (leva 1) para notificar o painel quando um cartao de
-- fidelidade acaba de completar -- reaproveita exatamente o ponto onde a funcao ja detecta essa
-- transicao (selos_atual >= selos_necessarios), sem precisar de trigger separada.

create or replace function atualizar_status_agendamento(
  p_agendamento_id uuid,
  p_novo_status status_agendamento
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_agendamento agendamentos;
  v_status_anterior status_agendamento;
  v_programa programas_fidelidade;
  v_cartao cartoes_fidelidade;
  v_selo_inserido boolean;
  v_cliente_nome text;
begin
  select * into v_agendamento from agendamentos
    where id = p_agendamento_id and estabelecimento_id in (select meus_estabelecimentos())
    for update;
  if not found then
    raise exception 'agendamento nao encontrado ou sem permissao';
  end if;

  v_status_anterior := v_agendamento.status;
  if v_status_anterior = p_novo_status then
    return;
  end if;

  update agendamentos set status = p_novo_status where id = p_agendamento_id;

  -- Concede selo: so quando a transicao E PARA 'concluido' e o plano do estabelecimento ainda
  -- permite fidelidade (se nao permitir, so pula silenciosamente -- "Concluir" nunca falha por
  -- causa do gate de plano).
  if p_novo_status = 'concluido' and v_status_anterior <> 'concluido'
     and estabelecimento_permite_fidelidade(v_agendamento.estabelecimento_id) then
    select * into v_programa from programas_fidelidade
      where estabelecimento_id = v_agendamento.estabelecimento_id
        and servico_id = v_agendamento.servico_id
        and ativo;
    if found then
      select * into v_cartao from cartoes_fidelidade
        where cliente_id = v_agendamento.cliente_id
          and programa_id = v_programa.id
          and status in ('em_andamento', 'completo')
        for update;
      if not found then
        insert into cartoes_fidelidade (estabelecimento_id, cliente_id, programa_id)
          values (v_agendamento.estabelecimento_id, v_agendamento.cliente_id, v_programa.id)
          returning * into v_cartao;
      end if;

      insert into fidelidade_selos (cartao_id, agendamento_id)
        values (v_cartao.id, p_agendamento_id)
        on conflict (agendamento_id) do nothing;
      -- FOUND reflete se o insert acima realmente inseriu uma linha (false em conflito, ou seja,
      -- esse agendamento ja tinha gerado selo antes -- idempotente, nunca duplica).
      v_selo_inserido := found;

      if v_selo_inserido then
        update cartoes_fidelidade set selos_atual = selos_atual + 1
          where id = v_cartao.id
          returning * into v_cartao;
        if v_cartao.selos_atual >= v_programa.selos_necessarios and v_cartao.status <> 'completo' then
          update cartoes_fidelidade set status = 'completo', completado_em = now()
            where id = v_cartao.id;

          select nome into v_cliente_nome from clientes where id = v_agendamento.cliente_id;
          insert into notificacoes (estabelecimento_id, tipo, titulo, descricao, payload)
          values (
            v_agendamento.estabelecimento_id,
            'fidelidade_completo',
            'Cartão fidelidade completo',
            coalesce(v_cliente_nome, 'Um cliente') || ' completou o cartão "' || v_programa.nome || '"',
            jsonb_build_object('cartao_id', v_cartao.id, 'cliente_id', v_agendamento.cliente_id, 'programa_id', v_programa.id)
          );
        end if;
      end if;
    end if;
  end if;

  -- Revoga selo: correcao de um 'concluido' anterior para outro status. Bloqueia se o cartao ja
  -- foi resgatado (o brinde ja saiu fisicamente) -- nao da pra "desfazer" um resgate so reabrindo
  -- o agendamento, precisa de intervencao manual.
  if v_status_anterior = 'concluido' and p_novo_status <> 'concluido' then
    select c.* into v_cartao from cartoes_fidelidade c
      join fidelidade_selos s on s.cartao_id = c.id
      where s.agendamento_id = p_agendamento_id
      for update;
    if found then
      if v_cartao.status = 'resgatado' then
        raise exception 'este agendamento gerou um selo de um cartao de fidelidade ja resgatado; nao e possivel desfazer automaticamente, corrija manualmente se necessario';
      end if;
      delete from fidelidade_selos where agendamento_id = p_agendamento_id;
      update cartoes_fidelidade set
        selos_atual = selos_atual - 1,
        status = 'em_andamento',
        completado_em = null
        where id = v_cartao.id;
    end if;
  end if;
end;
$$;

grant execute on function atualizar_status_agendamento(uuid, status_agendamento) to authenticated;
