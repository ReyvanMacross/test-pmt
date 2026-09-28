# Portal Multi-Tenant Diskominfo Kota Bandung

Aplikasi admin berbasis Next.js untuk mengelola data website perangkat daerah Kota Bandung. Kode saat ini menyediakan dashboard dan pengelolaan website, template, pengguna, konten dasar, sampah website, dan log aktivitas. Database aplikasi diakses langsung menggunakan PostgreSQL melalui paket `pg`.

> **Status:** area admin sedang dikembangkan. Halaman publik dinamis untuk menampilkan website berdasarkan subdomain belum tersedia pada kode saat ini. Tombol “Lihat” di daftar website belum menjamin situs publik dapat dibuka.

## Teknologi

- Next.js `16.3.6` dan React `19`
- PostgreSQL melalui `pg`
- Autentikasi aplikasi dengan bcrypt dan JWT cookie
- Tailwind CSS 4

## Prasyarat

- Node.js versi LTS yang kompatibel dengan Next.js 16
- npm
- PostgreSQL aktif, misalnya dari Laragon
- Database dan struktur tabel yang **sudah sesuai dengan query aplikasi**

## Menjalankan secara lokal

1. Jalankan PostgreSQL dari Laragon dan siapkan database pengembangan.
2. Buat file `.env.local` di root proyek. Isi variabel berikut sesuai konfigurasi PostgreSQL Laragon Anda:

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=isi_password_postgres_lokal
   DB_NAME=multisite_diskominfo
   SESSION_SECRET=ganti_dengan_rahasia_acak_minimal_32_byte
   ```

   Sesuaikan nama database, pengguna, port, dan kata sandi dengan instalasi Laragon Anda. Gunakan rahasia sesi acak yang berbeda untuk setiap lingkungan.

3. Pasang dependensi dan jalankan server pengembangan:

   ```bash
   npm install
   npm run dev
   ```

4. Buka [http://localhost:3000](http://localhost:3000). Aplikasi saat ini mengarahkan halaman root ke `/login`.

Perintah yang tersedia:

```bash
npm run dev     # server pengembangan
npm run build   # build produksi
npm run start   # menjalankan build produksi
npm run lint    # pemeriksaan ESLint
```

## Database PostgreSQL

Aplikasi mendukung dua konfigurasi PostgreSQL server-side:

- Laragon/lokal: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- Supabase PostgreSQL: `DATABASE_URL` dari panel Supabase. Bila `DATABASE_URL` ada, aplikasi menggunakannya melalui TLS; variabel ini hanya boleh berada di server dan jangan diberi awalan `NEXT_PUBLIC_`.

Untuk Supabase, jalankan [supabase_postgres_schema.sql](</C:/Users/USER/Documents/company diskominfo/diskominfo-nextjs/supabase_postgres_schema.sql>) hanya pada project Supabase baru/kosong setelah diperiksa. Ambil connection string PostgreSQL dari **Connect** di dashboard Supabase; untuk deployment pilih metode koneksi yang sesuai lingkungan hosting (pooler bila koneksi IPv4 langsung tidak tersedia). Atur sebagai `DATABASE_URL` di environment server Next.js, jangan commit nilainya.

Untuk login development awal, setelah skema dibuat jalankan [supabase_dev_admin_seed.sql](</C:/Users/USER/Documents/company diskominfo/diskominfo-nextjs/supabase_dev_admin_seed.sql>) satu kali. Kredensial sementara: `admin@diskominfo.local` / `AdminLokal2026!`. Akun ini hanya untuk lokal/testing; ganti password dan hapus/nonaktifkan seed tersebut sebelum aplikasi dipublikasikan.

> **Penting:** `supabase_schema.sql` adalah rancangan lama berbasis `auth.users`/`profiles` dan bukan skema yang digunakan kode saat ini. Jangan langsung menjalankannya pada database Laragon yang sudah berisi data. Skema baru mengikuti tabel `users` dan query aplikasi saat ini, tetapi juga ditujukan untuk instalasi Supabase yang baru/kosong, bukan untuk mengubah database produksi yang sudah berjalan.

Sebelum menyiapkan atau mengubah skema database:

1. Pastikan database yang dipakai adalah database pengembangan, bukan database berisi data penting.
2. Buat backup yang dapat dipulihkan sebelum migrasi.
3. Periksa tabel, kolom, tipe data, foreign key, index, dan constraint aktual secara read-only.
4. Bandingkan struktur aktual dengan query di folder `app/` dan `lib/`.
5. Uji perubahan pada salinan database terlebih dahulu. Hindari `DROP`, `TRUNCATE`, atau menjalankan ulang skrip inisialisasi pada database aktif.

Tabel yang dirujuk kode antara lain `users`, `websites`, `templates`, `activity_logs`, `contents`, serta tabel pendukung profil wilayah dan galeri. Kebutuhan kolom dapat berubah; query aplikasi adalah acuan tambahan saat memeriksa skema. SQL baru mengaktifkan RLS tanpa policy akses publik; akses data dilakukan dari server Next.js. Login aplikasi tetap menggunakan tabel `users`, bcrypt, dan JWT, bukan Supabase Auth.

## Area aplikasi

- `/login` — autentikasi admin.
- `/admin/dashboard` — ringkasan website dan aktivitas.
- `/admin/network` — daftar, pencarian, dan pengelolaan website perangkat daerah.
- `/admin/network/create` — pendaftaran website.
- `/admin/network/[id]/edit` — pengaturan website.
- `/admin/network/[id]/content` — modul konten dasar.
- `/admin/network/trashed` — website yang dihapus sementara.
- `/admin/templates` — pengelolaan template.
- `/admin/users` — pengelolaan pengguna.
- `/admin/activities` — log aktivitas.

Rute admin memerlukan sesi. Hak akses lintas website dan pembatasan berdasarkan peran perlu tetap diperiksa di server pada setiap Server Action dan query sensitif.

## Catatan keamanan

- Jangan commit `.env.local` atau kredensial database. File `.env*` diabaikan oleh Git.
- Jangan gunakan rahasia sesi bawaan untuk deployment. Tetapkan `SESSION_SECRET` acak yang kuat dan rahasia database yang sesuai.
- Gunakan akun PostgreSQL khusus aplikasi dengan hak minimum; hindari akun superuser untuk menjalankan aplikasi.
- Buat backup sebelum perubahan skema atau operasi penghapusan data.
- Validasi status, ID, dan input lain di server. Validasi di antarmuka saja tidak melindungi Server Action.
- Pastikan otorisasi memeriksa tenant/pemilik website, termasuk pada operasi restore, hapus, dan edit konten.

## Struktur direktori ringkas

```text
app/                 Halaman, layout, Server Actions, dan API Next.js
app/admin/           Area administrasi
lib/auth.js          Pembuatan dan pembacaan sesi aplikasi
lib/db.js            Pool koneksi PostgreSQL
lib/supabase/        Helper Supabase; bukan jalur utama query PostgreSQL saat ini
supabase_schema.sql  Rancangan skema Supabase, perlu penyesuaian sebelum digunakan
public/              Aset statis dan logo
```
