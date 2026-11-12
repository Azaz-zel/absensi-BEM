-- ============================================================
-- Patch: hapus nomor WhatsApp dari form absen
-- Jalankan SEKALI kalau database sudah dibuat dengan schema.sql versi lama.
-- ============================================================

alter table public.submissions
  alter column submitter_wa drop not null;

drop index if exists public.submissions_session_submitter_uniq;

-- Baris lama tetap menyimpan nomor WA-nya. Kalau mau dibersihkan:
-- update public.submissions set submitter_wa = null where submitter_wa is not null;
