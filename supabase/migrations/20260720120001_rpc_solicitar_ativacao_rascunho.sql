-- RPC publica (anon) para o cliente que recebeu o link de uma pagina de demonstracao pedir
-- ativacao. Gera uma notificacao (tabela ja existente, ver 20260719110002_notificacoes.sql) que o
-- super_admin ve no sino do /admin -- eh_super_admin() ja tem bypass de leitura nessa tabela,
-- entao nao precisa de policy nova, so essa RPC de escrita controlada.

create or replace function solicitar_ativacao_rascunho(p_estabelecimento_id uuid, p_nome text, p_telefone text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_rascunho boolean;
begin
  select rascunho into v_rascunho from estabelecimentos where id = p_estabelecimento_id;
  if v_rascunho is not true then
    raise exception 'estabelecimento nao encontrado ou nao e uma pagina de demonstracao';
  end if;

  -- Evita duplicar notificacao se o cliente clicar mais de uma vez antes de alguem ler.
  if exists (
    select 1 from notificacoes
    where estabelecimento_id = p_estabelecimento_id and tipo = 'demo_ativacao_solicitada' and not lida
  ) then
    return;
  end if;

  insert into notificacoes (estabelecimento_id, tipo, titulo, descricao, payload)
  values (
    p_estabelecimento_id,
    'demo_ativacao_solicitada',
    p_nome || ' quer ativar a demonstração',
    nullif(p_telefone, ''),
    jsonb_build_object('nome', p_nome, 'telefone', nullif(p_telefone, ''))
  );
end;
$$;

grant execute on function solicitar_ativacao_rascunho(uuid, text, text) to anon, authenticated;
