-- Troca o campo de contato de "Quero ativar minha conta" de WhatsApp (opcional) para e-mail
-- (obrigatorio) -- fecha o loop com o convite de reivindicacao, que ja precisa de e-mail
-- (inviteUserByEmail) e antes exigia o super_admin pedir isso manualmente por fora.
-- Postgres nao deixa renomear parametro via create or replace (SQLSTATE 42P13), entao precisa
-- de drop function antes, mesmo a assinatura de tipos (uuid, text, text) sendo igual.

drop function solicitar_ativacao_rascunho(uuid, text, text);

create function solicitar_ativacao_rascunho(p_estabelecimento_id uuid, p_nome text, p_email text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_rascunho boolean;
begin
  select rascunho into v_rascunho from estabelecimentos where id = p_estabelecimento_id;
  if v_rascunho is not true then
    raise exception 'estabelecimento nao encontrado ou nao e uma pagina de demonstracao';
  end if;

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
    p_email,
    jsonb_build_object('nome', p_nome, 'email', p_email)
  );
end;
$$;

grant execute on function solicitar_ativacao_rascunho(uuid, text, text) to anon, authenticated;
