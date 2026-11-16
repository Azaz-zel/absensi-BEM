-- Piket: satu sesi per hari, shift dicatat per kiriman.
-- Jalankan sekali di Supabase SQL Editor.

alter table public.submissions
  add column if not exists shift text
  check (shift in ('pagi', 'sore'));

-- Isi shift kiriman lama dari shift sesinya.
update public.submissions as s
set shift = sess.shift
from public.sessions as sess
where sess.id = s.session_id
  and s.shift is null
  and sess.kind = 'piket'
  and sess.shift in ('pagi', 'sore');

-- Kiriman yang dipindah dari sesi sore 16 Nov 2026 (Desak).
update public.submissions
set shift = 'sore'
where id = 'e52838bb-3aba-4e72-b0dc-d7a62e580774';
