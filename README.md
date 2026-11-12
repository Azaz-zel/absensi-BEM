# Absen Piket & Proker — BEM PM INSTIKI

Pencatatan kehadiran fungsionaris Kabinet Navakara. Next.js (App Router) +
TypeScript, Supabase (Postgres, Storage, Auth), self-hosted.

## Fitur

- **Beranda = pilihan absen**: piket atau proker.
- **Absen piket** (`/piket`), tanpa login: tanggal, shift Pagi/Sore, lokasi,
  keterangan, nama pengabsen, daftar nama (dropdown seluruh roster),
  kementerian per nama, foto bukti.
- **Absen proker** (`/proker`), wajib login sebagai menteri/wakil menteri:
  tanggal, nama proker, lokasi proker, keterangan, daftar nama yang hadir,
  foto bukti. Pengisi tercatat otomatis dari akun yang login.
- Admin tidak ditautkan dari halaman absen; buka `/admin` langsung lalu login.
- Foto dikompres di browser (~1600px JPEG) dan metadata EXIF dibuang.
- Draft tersimpan di IndexedDB per jenis absen; kirim ulang tidak membuat duplikat.
- Roster 64 fungsionaris dari 5 kementerian, sudah di-seed.
- Admin: ranking orang + kementerian, filter tanggal/jenis/shift, tabel sesi,
  verifikasi, foto bukti, kelola roster/kementerian, gabung nama duplikat, CSV.

## Setup

1. Buat project di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan `supabase/schema.sql`, lalu `supabase/seed.sql`.
3. Salin `.env.example` menjadi `.env.local` dan isi:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (boleh publishable key)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only, boleh secret key)
4. Buat user admin: **Authentication → Users → Add user** (email + password).
5. Daftarkan user itu ke tabel admin (ganti emailnya):

   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'admin@example.com'
   on conflict (user_id) do nothing;
   ```

6. Buat akun untuk setiap menteri dan wakil menteri di
   **Authentication → Users** (email + password), lalu daftarkan:

   ```sql
   insert into public.proker_officers (user_id, email, full_name, ministry_id, role)
   select u.id, u.email, 'Nama Menteri', m.id, 'menteri'
   from auth.users u
   cross join public.ministries m
   where u.email = 'menteri@example.com'
     and m.name = 'Kementerian Dalam Negeri'
   on conflict (user_id) do nothing;
   ```

   `role` diisi `menteri` atau `wakil_menteri`. Akun yang tidak terdaftar di
   tabel ini tidak bisa membuka form proker.

7. Jalankan:

   ```bash
   npm install
   npm run dev
   ```

   - Pilihan absen: http://localhost:3000
   - Absen piket: http://localhost:3000/piket
   - Absen proker: http://localhost:3000/proker (login di `/proker/masuk`)
   - Admin (ketik langsung): http://localhost:3000/admin

Sudah pernah menjalankan `schema.sql` versi lama? Jalankan patch yang relevan
sekali saja:

- `supabase/patch-remove-wa.sql` — kalau dibuat sebelum field WhatsApp dihapus.
- `supabase/patch-proker.sql` — kalau dibuat sebelum fitur absen proker ada.

Tanpa `.env.local`, panel admin dan form proker **tertutup**: `/admin` dan
`/proker` selalu dialihkan ke halaman login yang memberi tahu bahwa Supabase
belum diatur. Untuk melihat tampilan dengan data contoh, nyalakan mode demo:

```bash
# PowerShell
$env:DEMO_MODE=1; npm run dev
# atau tambahkan DEMO_MODE=1 di .env.local
```

Mode demo tidak pernah aktif kalau `SUPABASE_SERVICE_ROLE_KEY` sudah diisi.
Roster demo dibuat otomatis dari seed:

```bash
python scripts/gen-demo-roster.py
```

Jalankan ulang skrip itu setiap kali `supabase/seed.sql` berubah.

## Deploy (server sendiri)

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  -t absen-piket .

docker run -d --name absen-piket -p 3000:3000 \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  absen-piket
```

Taruh di belakang nginx/Caddy dengan HTTPS. `NEXT_PUBLIC_*` di-bake saat build,
`SUPABASE_SERVICE_ROLE_KEY` diberikan saat runtime.

## Struktur data

| Tabel | Isi |
|---|---|
| `ministries` | 5 kementerian |
| `people` | roster kanonik (nama, NIM, kementerian) |
| `sessions` | satu baris per sesi: piket (tanggal + shift) atau proker (tanggal + nama proker) |
| `session_people` | kehadiran per orang per sesi |
| `submissions` | klaim pengabsen + foto bukti (proker menyimpan user petugas) |
| `admins` | whitelist user Supabase Auth untuk panel admin |
| `proker_officers` | whitelist menteri/wakil menteri untuk absen proker |

Satu sesi piket unik per `(tanggal, shift)`; sesi proker unik per
`(tanggal, nama proker)`. Satu sesi bisa punya beberapa submission; nama
digabung, bukan diduplikasi. `submissions.client_uuid` mencegah retry membuat
entri ganda. Semua akses database lewat service-role di server; RLS menutup
akses langsung dari browser.

## Verifikasi seed

```bash
python scripts/verify-seed.py "path/to/DATA FUNGSIONARIS.xlsx"
```

## Alat bantu dev

Butuh Edge terpasang dan dev server jalan di port 3000.

```bash
node scripts/measure.cjs http://localhost:3000/admin 390   # cari elemen yang bikin scroll horizontal
node scripts/shot.cjs http://localhost:3000/admin out.png mobile
node scripts/console.cjs http://localhost:3000              # error/warning di console
node scripts/smoke-form.cjs                                 # uji combobox, tempel nama, draft
node scripts/check-roster-filter.cjs                        # pastikan daftar nama ikut kementerian
```
