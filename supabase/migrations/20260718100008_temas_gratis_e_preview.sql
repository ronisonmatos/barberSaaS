-- Tema/template pode ser marcado gratuito (libera pra todo mundo sem passar por checkout) e
-- ganha uma foto de previa pro dono decidir se vale comprar antes de ver a demonstracao ao vivo.

alter table temas_plataforma add column gratis boolean not null default false;
alter table temas_plataforma add column foto_preview_url text;

-- Reaproveita o bucket "logos" (ja publico) -- so precisa de uma policy nova pra super_admin
-- poder subir/atualizar/remover arquivo em qualquer path (as policies existentes exigem que o
-- primeiro segmento do path seja um estabelecimento do proprio usuario, o que nao se aplica aqui).
create policy "super_admin sobe preview de tema" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'logos' and eh_super_admin());

create policy "super_admin atualiza preview de tema" on storage.objects for update
  to authenticated
  using (bucket_id = 'logos' and eh_super_admin());

create policy "super_admin remove preview de tema" on storage.objects for delete
  to authenticated
  using (bucket_id = 'logos' and eh_super_admin());
