-- 1. Add 'draft' to article_status enum
-- CATATAN: Di PostgreSQL, penambahan nilai enum baru sebaiknya di-commit terlebih dahulu sebelum dipakai dalam ekspresi tipe enum.
alter type public.article_status add value if not exists 'draft';

-- 2. Update guard_article_status function to allow 'draft' and 'pending' for non-admin
-- Menggunakan casting ::text agar aman dieksekusi tanpa error 55P04 (unsafe use of new enum value)
create or replace function public.guard_article_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    -- Non-admin can choose 'draft' or 'pending'. If they attempt to set 'published' or anything else, force 'pending'.
    if new.status::text not in ('draft', 'pending') then
      new.status := 'pending';
    end if;
    new.published_at := null;
    new.admin_note := case when tg_op = 'UPDATE' then old.admin_note else null end;
  elsif new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    new.published_at := now();
  end if;
  return new;
end $$;

-- 3. Update RLS DELETE policy on articles: only draft and rejected can be deleted by author
-- Menggunakan status::text agar aman dieksekusi tanpa error 55P04
drop policy if exists "articles author or admin delete" on public.articles;
create policy "articles author or admin delete" on public.articles for delete to authenticated
  using (
    (author_id = auth.uid() and status::text in ('draft', 'rejected'))
    or public.has_role(auth.uid(), 'admin')
  );


