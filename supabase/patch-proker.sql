-- ============================================================
-- Patch: tambah absen proker ke database yang sudah ada
-- Jalankan SEKALI kalau schema.sql versi lama sudah dijalankan.
-- Untuk database baru, cukup schema.sql (file ini tidak perlu).
-- ============================================================

-- ---------- Sesi: jenis + nama proker ----------
alter table public.sessions
  add column if not exists kind text not null default 'piket';

alter table public.sessions
  add column if not exists proker_name text;

alter table public.sessions
  add column if not exists proker_key text;

alter table public.sessions
  alter column shift drop not null;

alter table public.sessions
  drop constraint if exists sessions_kind_check;
alter table public.sessions
  add constraint sessions_kind_check check (kind in ('piket', 'proker'));

alter table public.sessions
  drop constraint if exists sessions_kind_shape;
alter table public.sessions
  add constraint sessions_kind_shape check (
    (kind = 'piket' and shift is not null)
    or (kind = 'proker' and proker_name is not null and proker_key is not null)
  );

create index if not exists sessions_kind_idx
  on public.sessions(kind, date desc);

create unique index if not exists sessions_proker_uniq
  on public.sessions(date, proker_key)
  where kind = 'proker' and deleted_at is null;

-- ---------- Submission: siapa yang mengisi (akun petugas) ----------
alter table public.submissions
  add column if not exists submitter_user_id uuid
  references auth.users(id) on delete set null;

alter table public.submissions
  add column if not exists submitter_ministry_id uuid
  references public.ministries(id) on delete set null;

-- ---------- Petugas absen proker ----------
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

alter table public.proker_officers enable row level security;

drop policy if exists "officer read self" on public.proker_officers;
create policy "officer read self" on public.proker_officers
  for select to authenticated using (user_id = auth.uid());

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

revoke all on function public.is_proker_officer() from public;
grant execute on function public.is_proker_officer() to authenticated;

-- ---------- Daftarkan petugas ----------
-- insert into public.proker_officers (user_id, email, full_name, ministry_id, role)
-- select u.id, u.email, 'Nama Menteri', m.id, 'menteri'
-- from auth.users u
-- cross join public.ministries m
-- where u.email = 'menteri@example.com'
--   and m.name = 'Kementerian Dalam Negeri'
-- on conflict (user_id) do nothing;
