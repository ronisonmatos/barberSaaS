-- O trigger anterior bloqueava tambem updates feitos com a service-role key (usada no bootstrap
-- do primeiro super_admin e em scripts administrativos) porque auth.uid() e null nesse contexto,
-- fazendo eh_super_admin() retornar false. service_role ja tem bypass total de RLS em toda tabela;
-- o trigger deve deixar esse mesmo papel passar.

create or replace function proteger_papel_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.papel is distinct from old.papel and not eh_super_admin() and auth.role() <> 'service_role' then
    raise exception 'nao autorizado a alterar o papel';
  end if;
  return new;
end;
$$;
