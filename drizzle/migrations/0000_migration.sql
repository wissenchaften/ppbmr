create type public.app_role as enum ('admin', 'member');
create type public.article_status as enum ('pending', 'published', 'rejected');
create type public.article_visibility as enum ('public', 'members');

create table public.profiles (
  id uuid primary key,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create table public.workshops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  address text not null,
  area text not null default 'Kota Malang',
  lat double precision not null,
  lng double precision not null,
  phone text,
  hours text,
  services text[] not null default '{}',
  description text,
  organization_profile text,
  benefits text[] not null default '{}',
  logo_url text,
  owner_id uuid,
  created_at timestamptz not null default now()
);
grant select on public.workshops to anon;
grant select, insert, update, delete on public.workshops to authenticated;
grant all on public.workshops to service_role;
alter table public.workshops enable row level security;

create or replace function public.is_member(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id, 'admin') or public.has_role(_user_id, 'member')
    or exists (select 1 from public.workshops where owner_id = _user_id)
$$;

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  author_id uuid not null,
  title text not null,
  content text not null,
  cover_url text,
  status article_status not null default 'pending',
  visibility article_visibility not null default 'public',
  admin_note text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);
grant select on public.articles to anon;
grant select, insert, update, delete on public.articles to authenticated;
grant all on public.articles to service_role;
alter table public.articles enable row level security;

-- profiles policies
create policy "own profile read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "own profile update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated
  with check (id = auth.uid());

-- roles
create policy "read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- workshops
create policy "workshops public read" on public.workshops for select to anon, authenticated using (true);
create policy "workshops admin insert" on public.workshops for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
create policy "workshops owner or admin update" on public.workshops for update to authenticated
  using (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  with check (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "workshops admin delete" on public.workshops for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- prevent owners changing owner_id
create or replace function public.guard_workshop_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') and new.owner_id is distinct from old.owner_id then
    new.owner_id := old.owner_id;
  end if;
  return new;
end $$;
create trigger guard_workshop_owner before update on public.workshops
  for each row execute function public.guard_workshop_owner();

-- articles
create policy "articles public read" on public.articles for select to anon, authenticated
  using (status = 'published' and visibility = 'public');
create policy "articles members read" on public.articles for select to authenticated
  using (status = 'published' and visibility = 'members' and public.is_member(auth.uid()));
create policy "articles own read" on public.articles for select to authenticated
  using (author_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "articles owner insert" on public.articles for insert to authenticated
  with check (author_id = auth.uid() and exists (
    select 1 from public.workshops w where w.id = workshop_id and (w.owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'))));
create policy "articles author or admin update" on public.articles for update to authenticated
  using (author_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  with check (author_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "articles author or admin delete" on public.articles for delete to authenticated
  using (author_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create or replace function public.guard_article_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    new.status := 'pending';
    new.published_at := null;
    new.admin_note := case when tg_op = 'UPDATE' then old.admin_note else null end;
  elsif new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    new.published_at := now();
  end if;
  return new;
end $$;
create trigger guard_article_status before insert or update on public.articles
  for each row execute function public.guard_article_status();

-- new user: profile + first user becomes admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- admin: assign workshop owner by email
create or replace function public.assign_workshop_owner(_workshop_id uuid, _email text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Hanya admin'; end if;
  if _email is null or _email = '' then
    update public.workshops set owner_id = null where id = _workshop_id; return;
  end if;
  select id into uid from public.profiles where lower(email) = lower(_email);
  if uid is null then raise exception 'Pengguna dengan email tersebut belum terdaftar'; end if;
  update public.workshops set owner_id = uid where id = _workshop_id;
  insert into public.user_roles (user_id, role) values (uid, 'member') on conflict do nothing;
end $$;
grant execute on function public.assign_workshop_owner(uuid, text) to authenticated;

insert into public.workshops (slug, name, address, area, lat, lng, phone, hours, services, description, organization_profile, benefits) values
('sumber-jaya-motor','Sumber Jaya Motor','Jl. Soekarno Hatta No. 12, Lowokwaru','Kota Malang',-7.9415,112.6205,'0341-555101','08.00–17.00',array['Servis rutin','Tune up','Ganti oli'],'Bengkel motor langganan mahasiswa di kawasan Suhat.','Berdiri sejak 2008, dikelola keluarga dengan 6 mekanik bersertifikat. Anggota aktif PPBMR sejak 2015.',array['Diskon 10% untuk mahasiswa','Garansi servis 7 hari','Cek kelistrikan gratis']),
('arjuna-auto-service','Arjuna Auto Service','Jl. Arjuno No. 45, Klojen','Kota Malang',-7.9771,112.6265,'0341-555202','08.00–18.00',array['Spooring balancing','Servis AC','Kaki-kaki'],'Spesialis mobil keluarga dan kaki-kaki.','Bengkel mobil dengan 10 mekanik dan peralatan spooring komputer. Fokus pada kejujuran dan transparansi harga.',array['Free inspeksi 20 titik','Ruang tunggu ber-AC & WiFi','Antar-jemput kendaraan area kota']),
('dinoyo-motor-sport','Dinoyo Motor Sport','Jl. MT Haryono No. 88, Dinoyo','Kota Malang',-7.9431,112.6122,'0341-555303','09.00–20.00',array['Modifikasi','Bore up','Dyno test'],'Spesialis performa dan modifikasi motor.','Didirikan oleh mantan pembalap lokal, menangani riset mesin dan setting injeksi.',array['Konsultasi modifikasi gratis','Member card poin servis','Dyno test harga khusus anggota']),
('batu-sentosa-bengkel','Batu Sentosa Bengkel','Jl. Diponegoro No. 21','Kota Batu',-7.8706,112.5265,'0341-555404','07.30–17.00',array['Rem & kopling','Servis tanjakan','Overhaul'],'Spesialis kendaraan untuk medan tanjakan Batu.','Melayani wisatawan dan warga Batu sejak 2001, terkenal dengan penanganan rem darurat.',array['Layanan darurat 24 jam','Cek rem gratis untuk wisatawan','Harga suku cadang transparan']),
('kepanjen-teknik','Kepanjen Teknik','Jl. Raya Kepanjen No. 105','Kabupaten Malang',-8.1305,112.5722,'0341-555505','08.00–16.30',array['Servis motor','Las & bubut','Ganti ban'],'Bengkel serba bisa di jantung Kepanjen.','Bengkel umum dengan fasilitas bubut dan las, melayani kendaraan niaga ringan dan motor.',array['Gratis cuci motor setiap servis','Cicilan servis besar','Garansi part 30 hari']),
('singosari-oto-care','Singosari Oto Care','Jl. Raya Singosari No. 33','Kabupaten Malang',-7.8932,112.6656,'0341-555606','08.00–17.00',array['Servis berkala','Body repair','Cat oven'],'Body repair dan cat oven untuk mobil.','Memiliki ruang cat oven standar pabrikan dan bekerja sama dengan beberapa asuransi.',array['Klaim asuransi dibantu','Garansi cat 1 tahun','Mobil pengganti (syarat berlaku)']),
('sawojajar-jaya-motor','Sawojajar Jaya Motor','Jl. Danau Toba No. 7, Sawojajar','Kota Malang',-7.9722,112.6602,'0341-555707','08.00–19.00',array['Injeksi','Scanner ECU','Servis CVT'],'Ahli motor matic dan injeksi.','Bengkel modern dengan scanner ECU multi-merek dan mekanik terlatih pabrikan.',array['Scan ECU gratis','Booking servis via WhatsApp','Diskon oli 15% untuk anggota PPBMR']),
('lawang-garage','Lawang Garage','Jl. Thamrin No. 18','Kabupaten Malang',-7.8355,112.6958,'0341-555808','08.00–17.00',array['Restorasi klasik','Kelistrikan','Servis umum'],'Spesialis restorasi motor & mobil klasik.','Bengkel restorasi yang telah menghidupkan kembali ratusan kendaraan klasik sejak 2010.',array['Dokumentasi proses restorasi','Konsultasi gratis','Komunitas klasik bulanan']);