-- ============================================================
-- Absen Piket BEM PM INSTIKI — schema
-- Jalankan sekali di Supabase SQL Editor.
-- Mencakup absen piket (publik) dan absen proker (khusus
-- menteri/wakil menteri yang login).
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Kementerian ----------
create table if not exists public.ministries (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Orang (roster kanonik) ----------
create table if not exists public.people (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  name_key    text not null unique,
  nim         text unique,
  ministry_id uuid references public.ministries(id) on delete set null,
  source      text not null default 'admin'
              check (source in ('seed', 'admin', 'pending')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists people_ministry_idx on public.people(ministry_id);

-- ---------- Sesi (piket & proker) ----------
create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null default 'piket'
              check (kind in ('piket', 'proker')),
  date        date not null,
  shift       text check (shift in ('pagi', 'sore')),
  proker_name text,
  proker_key  text,
  location    text,
  notes       text,
  status      text not null default 'self_reported'
              check (status in ('self_reported', 'verified')),
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  unique (date, shift),
  constraint sessions_kind_shape check (
    (kind = 'piket' and shift is not null)
    or (kind = 'proker' and proker_name is not null and proker_key is not null)
  )
);

create index if not exists sessions_date_idx on public.sessions(date desc);
create index if not exists sessions_live_idx
  on public.sessions(date desc) where deleted_at is null;
create index if not exists sessions_kind_idx
  on public.sessions(kind, date desc);

-- Satu sesi proker per tanggal + nama proker.
create unique index if not exists sessions_proker_uniq
  on public.sessions(date, proker_key)
  where kind = 'proker' and deleted_at is null;

-- ---------- Kehadiran per orang per sesi ----------
create table if not exists public.session_people (
  session_id  uuid not null references public.sessions(id) on delete cascade,
  person_id   uuid not null references public.people(id) on delete restrict,
  ministry_id uuid not null references public.ministries(id) on delete restrict,
  primary key (session_id, person_id)
);

create index if not exists session_people_person_idx
  on public.session_people(person_id);
create index if not exists session_people_ministry_idx
  on public.session_people(ministry_id);

-- ---------- Submission (klaim) ----------
create table if not exists public.submissions (
  id                    uuid primary key default gen_random_uuid(),
  client_uuid           uuid not null unique,
  session_id            uuid not null references public.sessions(id) on delete cascade,
  submitter_name        text not null,
  submitter_user_id     uuid references auth.users(id) on delete set null,
  submitter_ministry_id uuid references public.ministries(id) on delete set null,
  photo_path            text,
  note                  text,
  ip                    text,
  user_agent            text,
  status                text not null default 'self_reported'
                        check (status in ('self_reported', 'verified')),
  created_at            timestamptz not null default now(),
  edited_at             timestamptz
);

create index if not exists submissions_session_idx
  on public.submissions(session_id);

-- ---------- Admin panel ----------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       text not null default 'admin',
  created_at timestamptz not null default now()
);

-- ---------- Petugas absen proker (menteri / wakil menteri) ----------
create table if not exists public.proker_officers (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text not null,
  ministry_id uuid not null references public.ministries(id) on delete restrict,
  role        text not null default 'menteri'
              check (role in ('menteri', 'wakil_menteri')),
  created_at  timestamptz not null default now()
);

create index if not exists proker_officers_ministry_idx
  on public.proker_officers(ministry_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

-- Boleh mengisi absen proker?
create or replace function public.is_proker_officer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.proker_officers where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.is_proker_officer() from public;
grant execute on function public.is_proker_officer() to authenticated;

-- ---------- RLS ----------
alter table public.ministries      enable row level security;
alter table public.people          enable row level security;
alter table public.sessions        enable row level security;
alter table public.session_people  enable row level security;
alter table public.submissions     enable row level security;
alter table public.admins          enable row level security;
alter table public.proker_officers enable row level security;

-- Semua akses publik ditolak. Penulisan form lewat route handler service-role.
create policy "admin read ministries" on public.ministries
  for select to authenticated using (public.is_admin());
create policy "admin write ministries" on public.ministries
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin read people" on public.people
  for select to authenticated using (public.is_admin());
create policy "admin write people" on public.people
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin read sessions" on public.sessions
  for select to authenticated using (public.is_admin());
create policy "admin write sessions" on public.sessions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin read session_people" on public.session_people
  for select to authenticated using (public.is_admin());
create policy "admin write session_people" on public.session_people
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin read submissions" on public.submissions
  for select to authenticated using (public.is_admin());
create policy "admin write submissions" on public.submissions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin read admins" on public.admins
  for select to authenticated using (public.is_admin());

-- Petugas proker hanya boleh membaca barisnya sendiri.
create policy "officer read self" on public.proker_officers
  for select to authenticated using (user_id = auth.uid());

-- ---------- Storage ----------
insert into storage.buckets (id, name, public)
values ('bukti-piket', 'bukti-piket', false)
on conflict (id) do nothing;

-- Bucket privat: hanya service-role (server) yang membaca/menulis.
-- Signed URL dibuat di server setelah memeriksa sesi admin.

-- ---------- Bootstrap admin pertama ----------
-- 1) Buat user di Supabase > Authentication > Users (email + password).
-- 2) Jalankan, ganti emailnya:
-- insert into public.admins (user_id, email)
-- select id, email from auth.users where email = 'admin@example.com'
-- on conflict (user_id) do nothing;

-- ---------- Bootstrap petugas proker ----------
-- Ulangi untuk setiap menteri / wakil menteri.
-- Ganti email, nama, dan nama kementerian di bawah.
--
-- insert into public.proker_officers (user_id, email, full_name, ministry_id, role)
-- select u.id, u.email, 'Nama Menteri', m.id, 'menteri'
-- from auth.users u
-- cross join public.ministries m
-- where u.email = 'menteri@example.com'
--   and m.name = 'Kementerian Dalam Negeri'
-- on conflict (user_id) do nothing;
