# Portal Multi-Tenant Diskominfo Kota Bandung

Aplikasi berbasis Next.js untuk mengelola portal digital perangkat daerah (OPD) di lingkungan Pemerintah Kota Bandung. Proyek ini dirancang sebagai platform multi-tenant, di mana satu admin panel dapat mengelola banyak website atau portal milik berbagai perangkat daerah, instansi, dan unit kerja dalam satu ekosistem yang terpusat.

Tujuan utama aplikasi ini adalah mempermudah pengelolaan website pemerintahan secara terstruktur: mulai dari pendaftaran website, konfigurasi template, pengelolaan konten publik, pembagian hak akses pengguna, hingga pemantauan aktivitas dan log administratif. Data utama aplikasi disimpan di PostgreSQL melalui paket `pg`.

## Fitur utama

### 1. Manajemen multi-tenant website
- Mengelola banyak website secara terpisah dalam satu sistem.
- Setiap website dapat memiliki identitas, konfigurasi, template, dan konten yang berbeda.
- Mendukung alur pendaftaran, edit konfigurasi, dan pengelolaan website yang sedang aktif maupun yang disimpan sementara ke sampah.

### 2. Portal publik berbasis subdomain
- Setiap website dapat dipetakan ke subdomain atau identitas publik tersendiri.
- Struktur halaman publik dirancang untuk menampilkan informasi instansi secara terorganisir dan rapi.
- Memberikan pengalaman portal yang dapat dibedakan antar perangkat daerah meskipun dikelola dari satu kode dan satu panel admin.

### 3. Pengelolaan konten perangkat daerah
Website yang dikelola dapat mencakup berbagai modul utama, seperti:
- Beranda dan hero banner
- Profil instansi dan visi misi
- Struktur organisasi dan profil pimpinan
- Program, kegiatan, dan layanan publik
- Kontak dan informasi kantor
- PPID dan daftar informasi publik
- Berita, agenda, dokumen resmi, dan galeri
- Informasi publik yang sering dibutuhkan masyarakat

### 4. Template dan tata letak website
- Tersedia mekanisme pengelolaan template untuk mempercepat pembuatan dan konsistensi tampilan antar website.
- Memungkinkan kebutuhan visual yang berbeda antarinstitusi tanpa harus membangun ulang struktur dari nol.

### 5. Pengelolaan pengguna dan otorisasi
- Akses admin dibatasi berdasarkan peran dan hak kelola.
- Mendukung skenario multi-user, termasuk admin umum, pengelola website, dan pengguna dengan batasan akses tertentu.
- Keamanan akses perlu diperiksa secara server-side pada setiap action/SQL yang sensitif.

### 6. Dashboard dan aktivitas
- Dashboard untuk melihat ringkasan website dan aktivitas operasional.
- Log aktivitas untuk memantau perubahan yang dilakukan oleh pengguna atau admin.
- Memudahkan audit dan pelacakan perubahan data sistem.

## Status proyek

> **Status:** area admin sedang dikembangkan dan beberapa bagian portal publik masih dalam proses penyempurnaan. Fitur utama manajemen website dan konten sudah mengarah pada kebutuhan portal multi-tenant Pemerintah Kota Bandung, namun halaman publik yang ditampilkan berdasarkan subdomain masih harus diverifikasi dan disempurnakan sesuai kebutuhan produksi.

Tombol “Lihat” di daftar website belum sepenuhnya menjamin bahwa situs publik dapat dibuka pada seluruh kondisi lingkungan deployment.

## Teknologi

- Next.js `16.3.6` dan React `19`
- PostgreSQL melalui `pg`
- Autentikasi aplikasi dengan bcrypt dan JWT cookie
- Tailwind CSS 4

## Prasyarat

- Node.js versi LTS yang kompatibel dengan Next.js 16
- npm
- PostgreSQL aktif, misalnya dari Laragon
- Database dan struktur tabel yang sudah sesuai dengan query aplikasi

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
npm run start    # menjalankan build produksi
npm run lint    # pemeriksaan ESLint
```

## Area aplikasi

- `/login` — autentikasi admin.
- `/admin` — redirect ke area manajemen website.
- `/admin/dashboard` — ringkasan website dan aktivitas.
- `/admin/network` — daftar, pencarian, dan pengelolaan website perangkat daerah.
- `/admin/network/create` — pendaftaran website baru.
- `/admin/network/[id]/edit` — pengaturan website.
- `/admin/network/[id]/content` — modul konten dasar website.
- `/admin/network/trashed` — website yang dihapus sementara.
- `/admin/templates` — pengelolaan template.
- `/admin/users` — pengelolaan pengguna.
- `/admin/activities` — log aktivitas.
- `/[subdomain]` — halaman publik dinamis portal berdasarkan subdomain.

Rute admin memerlukan sesi. Hak akses lintas website dan pembatasan berdasarkan peran perlu tetap diperiksa di server pada setiap Server Action dan query sensitif.

## Struktur direktori ringkas

```text
app/                 Halaman, layout, Server Actions, dan API Next.js
app/admin/           Area administrasi
app/[subdomain]/     Halaman publik portal berdasarkan subdomain
lib/auth.js          Pembuatan dan pembacaan sesi aplikasi
lib/db.js            Pool koneksi PostgreSQL
lib/content-modules.js  Definisi modul konten website publik
lib/supabase/        Helper Supabase; bukan jalur utama query PostgreSQL saat ini
public/              Aset statis dan logo
```

## Kegunaan utama

Proyek ini cocok digunakan untuk kebutuhan portal digital pemerintahan, khususnya untuk:
- mengelola banyak website OPD dalam satu sistem;
- mempermudah pengelolaan isi, struktur, dan layanan publik;
- menyediakan satu platform administrasi untuk seluruh portal perangkat daerah Kota Bandung;
- mengurangi duplikasi kerja dalam pengelolaan konten website organisasi pemerintahan.

Dengan pendekatan multi-tenant ini, satu sistem dapat melayani banyak organisasi atau unit kerja sekaligus, sambil menjaga konsistensi tata kelola, akses, dan pengelolaan konten.

