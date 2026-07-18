-- CPF do dono (usuarios) e CNPJ opcional do estabelecimento. Guardados so numeros (sem
-- pontuacao/mascara), formatacao fica por conta da UI. Unique permite varios null
-- (quem nao preencheu ainda), mas impede duas contas/estabelecimentos com o mesmo
-- documento.

alter table usuarios add column cpf text unique;
alter table estabelecimentos add column cnpj text unique;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into usuarios (id, nome, telefone, papel, genero, cpf)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'telefone',
    'usuario',
    (new.raw_user_meta_data->>'genero')::genero_usuario,
    new.raw_user_meta_data->>'cpf'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
