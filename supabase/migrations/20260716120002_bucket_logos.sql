-- Bucket publico para logo dos estabelecimentos (aparece na pagina publica /b/{slug}).
-- Upload/update/delete restrito ao proprio estabelecimento via path {estabelecimento_id}/....

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "logos sao publicos para leitura" on storage.objects for select
  to public
  using (bucket_id = 'logos');

create policy "membros sobem logo do proprio estabelecimento" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1]::uuid in (select meus_estabelecimentos())
  );

create policy "membros atualizam logo do proprio estabelecimento" on storage.objects for update
  to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1]::uuid in (select meus_estabelecimentos())
  );

create policy "membros removem logo do proprio estabelecimento" on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1]::uuid in (select meus_estabelecimentos())
  );
