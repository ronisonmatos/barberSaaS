-- Genero do usuario (masculino/feminino), usado so para tratamento no texto de interface
-- (ex: "Dono"/"Dona"). Nullable porque usuarios existentes nao tem esse dado ainda --
-- so exibem o rotulo padrao ate preencherem em Configuracoes > Minha conta.

create type genero_usuario as enum ('masculino', 'feminino');

alter table usuarios add column genero genero_usuario;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into usuarios (id, nome, telefone, papel, genero)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'telefone',
    'usuario',
    (new.raw_user_meta_data->>'genero')::genero_usuario
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
