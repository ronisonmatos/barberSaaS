-- Modo suporte (super_admin acessa o /app do cliente pra diagnosticar/configurar) depende de
-- eh_super_admin() ja liberar escrita nas tabelas de dominio (ja e o caso em praticamente toda
-- policy desde a migration de RLS original). Mas duas RPCs security definer fazem sua propria
-- checagem de posse via meus_estabelecimentos(), sem o bypass -- corrigido aqui, mesmo padrao ja
-- usado em todo o resto do projeto.

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
    where id = p_agendamento_id
      and (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin())
    for update;
  if not found then
    raise exception 'agendamento nao encontrado ou sem permissao';
  end if;

  v_status_anterior := v_agendamento.status;
  if v_status_anterior = p_novo_status then
    return;
  end if;

  update agendamentos set status = p_novo_status where id = p_agendamento_id;

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

create or replace function resgatar_cartao_fidelidade(p_cartao_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_cartao cartoes_fidelidade;
begin
  select * into v_cartao from cartoes_fidelidade
    where id = p_cartao_id
      and (estabelecimento_id in (select meus_estabelecimentos()) or eh_super_admin())
    for update;
  if not found then
    raise exception 'cartao nao encontrado ou sem permissao';
  end if;
  if v_cartao.status <> 'completo' then
    raise exception 'cartao ainda nao esta completo';
  end if;

  update cartoes_fidelidade set status = 'resgatado', resgatado_em = now()
    where id = p_cartao_id;
end;
$$;
