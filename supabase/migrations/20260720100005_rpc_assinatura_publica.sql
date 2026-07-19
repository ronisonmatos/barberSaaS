-- RPC publica de assinatura do clube (cliente escolhe um plano e paga o 1o ciclo via Pix/cartao).
-- Mesmo esqueleto de criar_pedido_publico_pix: valida estabelecimento/gate/config de pagamento,
-- upsert de cliente por telefone, cria/reativa a assinatura como 'pendente' e o pagamento
-- correspondente -- o webhook confirma depois (ver migration seguinte).

create or replace function criar_assinatura_publica_pix(
  p_estabelecimento_id uuid,
  p_plano_id uuid,
  p_nome text,
  p_telefone text,
  p_email text,
  p_metodo metodo_pagamento default 'pix'
) returns table (assinatura_id uuid, pagamento_id uuid, token_acesso uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_estabelecimento estabelecimentos;
  v_config estabelecimento_pagamento_config;
  v_plano planos_estabelecimento;
  v_cliente_id uuid;
  v_token uuid;
  v_assinatura_id uuid;
  v_pagamento_id uuid;
begin
  if p_metodo not in ('pix', 'cartao') then
    raise exception 'metodo de pagamento invalido';
  end if;
  if p_nome is null or length(trim(p_nome)) = 0 then
    raise exception 'nome obrigatorio';
  end if;
  if p_telefone !~ '^\+[1-9]\d{7,14}$' then
    raise exception 'telefone invalido, use formato E.164';
  end if;
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'e-mail invalido';
  end if;

  select * into v_estabelecimento from estabelecimentos where id = p_estabelecimento_id and status in ('ativa', 'trial');
  if not found then
    raise exception 'estabelecimento indisponivel';
  end if;

  if not estabelecimento_permite_clube_assinatura(p_estabelecimento_id) then
    raise exception 'clube de assinatura indisponivel para este estabelecimento';
  end if;

  select * into v_plano from planos_estabelecimento
    where id = p_plano_id and estabelecimento_id = p_estabelecimento_id and ativo;
  if not found then
    raise exception 'plano indisponivel';
  end if;

  select * into v_config from estabelecimento_pagamento_config where estabelecimento_id = p_estabelecimento_id;
  if not found or not v_config.aceita_pagamento_antecipado or v_config.gateway_ativo <> 'mercado_pago' then
    raise exception 'pagamento antecipado indisponivel para este estabelecimento';
  end if;

  insert into clientes (estabelecimento_id, nome, telefone, email)
  values (p_estabelecimento_id, trim(p_nome), p_telefone, p_email)
  on conflict (estabelecimento_id, telefone) do update
    set nome = excluded.nome,
        email = coalesce(excluded.email, clientes.email)
  returning clientes.id, clientes.token_acesso into v_cliente_id, v_token;

  -- Reaproveita a mesma linha se o cliente ja assinou este plano antes (pendente/inadimplente/
  -- cancelada/pausada) -- renovacao e reativacao sao so "assinar de novo" pelo mesmo fluxo.
  insert into assinaturas_clientes (estabelecimento_id, cliente_id, plano_id, status, ciclo_inicio, ciclo_fim, usos_ciclo)
  values (p_estabelecimento_id, v_cliente_id, p_plano_id, 'pendente', now(), now() + interval '30 days', '{}')
  on conflict (cliente_id, plano_id) do update
    set status = 'pendente'
  returning assinaturas_clientes.id into v_assinatura_id;

  insert into pagamentos (estabelecimento_id, assinatura_cliente_id, cliente_id, valor_centavos, metodo, status)
  values (p_estabelecimento_id, v_assinatura_id, v_cliente_id, v_plano.preco_centavos, p_metodo, 'pendente')
  returning pagamentos.id into v_pagamento_id;

  return query select v_assinatura_id, v_pagamento_id, v_token;
end;
$$;

grant execute on function criar_assinatura_publica_pix(uuid, uuid, text, text, text, metodo_pagamento) to anon, authenticated;
