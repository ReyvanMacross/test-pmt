# Panduan uji database Laragon dan Supabase

Panduan ini menjelaskan cara menjalankan portal terhadap PostgreSQL Laragon atau Supabase dengan memilih satu database untuk satu proses Next.js. Kedua database tidak disinkronkan otomatis.

## Arsitektur data aplikasi

```text
Browser
  -> Next.js (Server Actions / API)
     -> node-postgres (`pg`) menggunakan DATABASE_URL
        -> satu target PostgreSQL: Laragon ATAU Supabase

Upload gambar/video/PDF -> `public/uploads/` pada mesin/server aplikasi
Metadata dan path file  -> PostgreSQL
```

Aplikasi menggunakan autentikasi sendiri dari tabel `public.users` (bcrypt + JWT). Koneksi ini tidak menggunakan Supabase Auth dan tidak membutuhkan `NEXT_PUBLIC_SUPABASE_URL`, anon key, ataupun service-role key. Jangan pernah memasukkan anon/service-role key ke `DATABASE_URL`.

Peralihan `DATABASE_URL` hanya mengalihkan query database. Itu tidak menyalin data, tidak menyinkronkan perubahan antar database, dan tidak memindahkan byte file upload. Saat aplikasi mengarah ke Supabase, unggahan masih masuk ke `public/uploads` pada mesin yang menjalankan Next.js. Salin dan cadangkan direktori tersebut secara terpisah. Integrasi Supabase Storage/object storage belum dilakukan.

## Sebelum mulai

1. Buat salinan cadangan database yang sudah berisi data. Jangan jalankan skema awal di database Laragon aktif.
2. Pastikan PostgreSQL Laragon berjalan dan nama database lokal yang digunakan adalah `multisite_diskominfo` (atau sesuaikan env contoh).
3. Untuk uji cloud, buat project Supabase baru/kosong. Jangan gunakan SQL legacy `supabase_schema.sql`; file itu dibuat untuk model `profiles`/Supabase Auth dan bukan skema aplikasi saat ini.
4. Gunakan `supabase_postgres_schema.sql` untuk project Supabase PostgreSQL baru. File ini membuat tabel yang digunakan aplikasi, indeks, RLS, dan seed modul menu. Ia tidak membuat akun admin.

## A. Siapkan Supabase dengan SQL paste langsung

1. Buka project Supabase, masuk ke **SQL Editor**, lalu pilih **New query**.
2. Buka file [`supabase_postgres_schema.sql`](../supabase_postgres_schema.sql), salin seluruh isinya, tempel ke SQL Editor, lalu klik **Run**.
3. Tunggu query selesai. Jika ada error, jangan lanjutkan dengan query akun sampai skema berhasil dibuat. Simpan teks error untuk dianalisis.
4. Verifikasi tabel dan seed modul lewat SQL Editor:

```sql
SELECT current_database() AS database, current_user AS db_user;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT count(*) AS jumlah_modul FROM public.menu_items;
```

Jalankan skema penuh hanya pada project baru/kosong. `CREATE TABLE IF NOT EXISTS` tidak menambahkan kolom yang hilang ke tabel lama, jadi menjalankannya ulang bukan migrasi. Untuk project yang sudah pernah diisi atau memakai schema lama, buat project uji baru atau siapkan migrasi eksplisit setelah backup.

### Buat akun super-admin uji di Supabase

Skema awal tidak membuat admin. Buat hash password secara lokal agar password asli tidak perlu ditempel ke SQL:

```powershell
npm run db:hash-password
```

Masukkan password uji minimal 8 karakter di terminal; karakter tidak akan ditampilkan. Salin hash bcrypt yang dicetak. Di SQL Editor Supabase, jalankan query berikut setelah mengganti email unik dan hash:

```sql
INSERT INTO public.users (name, email, password, role, instansi, permissions)
VALUES (
  'Admin Uji Supabase',
  'admin.supabase.uji@contoh.go.id',
  '$2b$10$TEMPEL_HASH_BCRYPT_HASIL_PERINTAH_LOKAL_DI_SINI',
  'super-admin',
  'Diskominfo Kota Bandung',
  '["manage-all-websites", "manage-templates", "manage-users", "view-all-logs"]'::jsonb
)
ON CONFLICT (email) DO NOTHING;
```

Jangan tempel password teks biasa ke SQL. Jangan gunakan seed akun development yang kata sandinya diketahui pada project cloud, staging bersama, atau production. Setelah akun dibuat, pastikan email yang dimasukkan adalah email uji yang sama dengan yang dipakai saat login.

## B. Atur koneksi Laragon

Contoh aman tersedia di [`.env.laragon.example`](../.env.laragon.example). Salin ke `.env.local`, lalu ganti kredensial placeholder dengan nilai PostgreSQL Laragon milik Anda:

```powershell
Copy-Item .env.laragon.example .env.local -Force
notepad .env.local
```

Contoh format (jangan menyalin placeholder apa adanya):

```dotenv
DATABASE_URL=postgresql://postgres:URL_ENCODED_PASSWORD@127.0.0.1:5432/multisite_diskominfo
DB_SSL=false
DB_POOL_MAX=10
SESSION_SECRET=GANTI_DENGAN_SECRET_RANDOM_MINIMAL_32_KARAKTER
```

Gunakan nilai yang sama dengan konfigurasi Laragon Anda jika host, port, user, password, atau nama database berbeda. Untuk format URL, karakter khusus di password seperti `@`, `#`, `/`, `:`, `%`, atau spasi harus di-URL-encode. Alternatifnya, gunakan variabel terpisah `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, dan `DB_NAME` tanpa `DATABASE_URL` jika konfigurasi aplikasi lokal Anda memang memakai format itu.

## C. Atur koneksi Supabase

1. Di dashboard Supabase, buka **Connect** dan salin connection string PostgreSQL yang disediakan.
2. Untuk menjalankan Next.js dari Windows/laptop, pilih **Session pooler** jika direct endpoint tidak dapat dijangkau karena jaringan IPv4. Salin host, port, username, database, dan format URL persis dari dashboard; jangan menebak host atau username pooler.
3. Isi `DATABASE_URL` dari connection string itu ke `.env.local`, lalu aktifkan SSL:

```dotenv
DATABASE_URL=postgresql://USER_DARI_DASHBOARD:URL_ENCODED_PASSWORD@HOST_DARI_DASHBOARD:5432/postgres
DB_SSL=true
DB_POOL_MAX=5
SESSION_SECRET=SECRET_RANDOM_KHUSUS_ENV_INI_MINIMAL_32_KARAKTER
```

Nilai di atas hanya contoh bentuk. Password database Supabase adalah password database project, bukan password akun Supabase. Jika password memiliki karakter khusus, URL-encode bagian password saja. Untuk koneksi Supabase dari proses server long-lived seperti `next dev`, Session pooler port 5432 adalah pilihan praktis. Direct connection cocok jika jaringan mendukung IPv6; Transaction pooler port 6543 ditujukan untuk pola koneksi yang lebih singkat/serverless dan memiliki batasan fitur seperti prepared statements.

## D. Jalankan dan verifikasi dua target

Pemeriksaan koneksi berikut tidak mencetak password maupun data pengguna:

```powershell
npm run db:check
```

Hasil yang diharapkan:

- Laragon: database `multisite_diskominfo`, host `localhost`/`127.0.0.1`, SSL nonaktif, tabel wajib `13/13`.
- Supabase: database biasanya `postgres`, host pooler/direct sesuai dashboard, SSL aktif, tabel wajib `13/13`.

Uji secara bergantian agar jelas target yang sedang dipakai:

1. Hentikan `npm run dev` dengan `Ctrl+C` sebelum mengganti database.
2. Pilih env Laragon, jalankan `npm run db:check`, lalu `npm run dev`. Login dengan akun yang sudah ada di Laragon. Buat/edit satu record uji yang mudah dikenali.
3. Periksa record di Laragon melalui pgAdmin/psql, misalnya:

```sql
SELECT id, name, email FROM public.users ORDER BY created_at DESC LIMIT 5;
SELECT id, name, subdomain FROM public.websites ORDER BY id DESC LIMIT 5;
SELECT id, action, description, created_at FROM public.activity_logs ORDER BY created_at DESC LIMIT 5;
```

4. Hentikan server, ganti `.env.local` ke kredensial Supabase, jalankan lagi `npm run db:check`, kemudian `npm run dev`. Login dengan akun uji Supabase yang dibuat di atas. Buat data uji berbeda.
5. Verifikasi hasil Supabase dengan query yang sama di **SQL Editor**. Pastikan data uji dari Laragon tidak muncul di Supabase secara otomatis.

Next.js membaca `.env.local` ketika proses dimulai. Selalu restart `next dev` setelah mengganti env. `.env.local` berisi rahasia dan sudah diabaikan Git; jangan kirim file tersebut atau screenshot yang memperlihatkan nilainya.

## Nilai SSL yang dipakai aplikasi

- `DB_SSL=false`: Laragon lokal tanpa SSL.
- `DB_SSL=true`: koneksi remote Supabase dengan verifikasi sertifikat TLS.
- Jika Node.js melaporkan `self-signed certificate in certificate chain`, unduh CA certificate di **Supabase Dashboard → Database → Settings → SSL Configuration**, simpan sebagai `certs/supabase-ca.crt`, lalu tambahkan `DB_SSL_CA_FILE=certs/supabase-ca.crt` ke `.env.local`. Koneksi tetap memverifikasi sertifikat dengan `rejectUnauthorized: true`.
- Jika `DB_SSL` tidak diisi, production mengaktifkan SSL dan development mematikannya.

Jangan mematikan validasi sertifikat TLS sebagai solusi permanen. Perubahan di `lib/db.js` ini memungkinkan Supabase SSL diuji dari mode development tanpa mengubah mode Laragon.

## Batasan dan langkah migrasi data

Panduan ini menyiapkan dua target untuk pengujian, bukan replikasi dua arah. Data Laragon yang sekarang sudah ada tidak otomatis berada di Supabase. Untuk memindahkan data, buat backup `pg_dump`, tinjau perbedaan schema dan foreign key, migrasikan urutan data dengan ID/sequence yang benar, lalu pindahkan file dari `public/uploads` secara terpisah. Jangan restore dump Laragon ke project Supabase yang sudah berisi data tanpa rencana migrasi dan backup.

Untuk deployment yang berjalan di mesin berbeda atau beberapa instance, `public/uploads` lokal tidak cukup persisten/berbagi. Rancang integrasi object storage (Supabase Storage/S3 kompatibel) dan migrasi URL/path sebelum mengandalkannya sebagai tempat file produksi.
