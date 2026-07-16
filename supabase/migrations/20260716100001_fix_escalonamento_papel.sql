-- Corrige furo de seguranca: a policy de update de usuarios so checava id = auth.uid(),
-- sem proteger a coluna papel. Qualquer usuario autenticado conseguia se promover a super_admin.

create or replace function proteger_papel_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.papel is distinct from old.papel and not eh_super_admin() then
    raise exception 'nao autorizado a alterar o papel';
  end if;
  return new;
end;
$$;

create trigger proteger_papel_usuario_trigger
  before update on usuarios
  for each row execute function proteger_papel_usuario();
