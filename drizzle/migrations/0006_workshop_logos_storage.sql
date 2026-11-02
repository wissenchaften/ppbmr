insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workshop-logos',
  'workshop-logos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public Access to Workshop Logos'
  ) then
    create policy "Public Access to Workshop Logos" on storage.objects for select
      using (bucket_id = 'workshop-logos');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated users can upload workshop logos'
  ) then
    create policy "Authenticated users can upload workshop logos" on storage.objects for insert
      to authenticated
      with check (bucket_id = 'workshop-logos');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated users can update workshop logos'
  ) then
    create policy "Authenticated users can update workshop logos" on storage.objects for update
      to authenticated
      using (bucket_id = 'workshop-logos');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated users can delete workshop logos'
  ) then
    create policy "Authenticated users can delete workshop logos" on storage.objects for delete
      to authenticated
      using (bucket_id = 'workshop-logos');
  end if;
end $$;

