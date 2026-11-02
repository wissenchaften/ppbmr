insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-covers',
  'article-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public Access to Article Covers'
  ) then
    create policy "Public Access to Article Covers" on storage.objects for select
      using (bucket_id = 'article-covers');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated users can upload article covers'
  ) then
    create policy "Authenticated users can upload article covers" on storage.objects for insert
      to authenticated
      with check (bucket_id = 'article-covers');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated users can update article covers'
  ) then
    create policy "Authenticated users can update article covers" on storage.objects for update
      to authenticated
      using (bucket_id = 'article-covers');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated users can delete article covers'
  ) then
    create policy "Authenticated users can delete article covers" on storage.objects for delete
      to authenticated
      using (bucket_id = 'article-covers');
  end if;
end $$;

