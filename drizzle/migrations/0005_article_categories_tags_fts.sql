-- 1. Create article_categories table
create table if not exists public.article_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Permissions & RLS for article_categories
alter table public.article_categories enable row level security;
grant select on public.article_categories to anon;
grant select on public.article_categories to authenticated;
grant all on public.article_categories to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'article_categories' and policyname = 'Anyone can view article categories'
  ) then
    create policy "Anyone can view article categories" on public.article_categories
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'article_categories' and policyname = 'Admins can manage article categories'
  ) then
    create policy "Admins can manage article categories" on public.article_categories
      for all
      to authenticated
      using (public.has_role(auth.uid(), 'admin'))
      with check (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

-- 2. Seed initial categories
insert into public.article_categories (name, slug, sort_order)
values
  ('Tips & Perawatan', 'tips-perawatan', 1),
  ('Promo Bengkel', 'promo-bengkel', 2),
  ('Modifikasi & Performa', 'modifikasi-performa', 3),
  ('Kabar Komunitas', 'kabar-komunitas', 4)
on conflict (slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order;

-- 3. Add category_id and tags to articles table
alter table public.articles
  add column if not exists category_id uuid references public.article_categories(id) on delete set null,
  add column if not exists tags text[] not null default '{}'::text[];

-- Set default category for existing articles if null
update public.articles
set category_id = (select id from public.article_categories where slug = 'tips-perawatan')
where category_id is null;

-- 4. Create GIN indices for tags and full-text search
create index if not exists articles_tags_idx on public.articles using gin (tags);

-- Helper function to make array_to_string IMMUTABLE for index expression
create or replace function public.immutable_array_to_string(arr text[], sep text)
returns text language sql immutable parallel safe as $$
  select array_to_string(arr, sep);
$$;

create index if not exists articles_fts_idx on public.articles using gin (
  to_tsvector('simple'::regconfig, coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(public.immutable_array_to_string(tags, ' '), ''))
);
