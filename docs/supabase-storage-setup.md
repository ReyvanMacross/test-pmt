# Supabase Storage untuk berkas portal

## Bucket

Buat atau gunakan bucket `portal-assets` di **Storage → Files**. Bucket ini berisi materi yang memang ditujukan untuk tampil di portal publik; isi bucket Public membuat URL objek dapat dibaca siapa pun yang memilikinya. Jangan unggah dokumen internal atau data pribadi ke bucket ini.

Folder seperti `image`, `jpeg`, `application/pdf`, dan `video/mp4` hanya mengelompokkan objek. Itu bukan daftar tipe MIME yang diizinkan. Buka **Edit bucket** dan atur batas ukuran serta MIME yang diperbolehkan. Tipe yang dipakai aplikasi:

- Gambar: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Video: `video/mp4`, `video/quicktime`, `video/webm`
- Dokumen: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

Di paket Supabase Free, set batas ukuran bucket paling tinggi 50 MB. Form aplikasi membatasi video langsung sampai 50 MB dan dokumen/gambar sampai 5 MB (galeri foto 2 MB). Untuk video di atas 6 MB, upload saat ini menggunakan standard upload; koneksi yang terputus mungkin perlu diulang. Supabase merekomendasikan resumable/TUS untuk file lebih dari 6 MB.

## Environment server

Tambahkan di `.env` lokal (atau secret environment deployment):

```dotenv
SUPABASE_STORAGE_BUCKET=portal-assets
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-baru>
```

`SUPABASE_SERVICE_ROLE_KEY` hanya boleh ada pada server. Jangan memakai prefix `NEXT_PUBLIC_`, memasukkannya ke client component, atau mengirim nilainya melalui chat. Karena service-role key sebelumnya pernah dibagikan di percakapan, buat key baru/rotate di Supabase sebelum dipakai. Restart server Next.js setelah mengubah environment.

## Alur aplikasi

1. Browser mengirim file ke server setelah validasi tipe/ukuran.
2. Server memeriksa sesi dan otorisasi website, lalu mengunggah file ke bucket melalui service-role key.
3. Server menyimpan URL publik dan metadata file di tabel modul terkait. Byte file berada di Supabase Storage; PostgreSQL hanya menyimpan URL/path, nama, tipe, dan ukuran.
4. Ganti/hapus file menghapus objek Supabase baru. File lama dengan path `/uploads/...` tetap ditangani sebagai file lokal.

Objek baru dikelompokkan per tenant di `websites/<website-id>/...`. Upload melalui server membuat aplikasi tidak membutuhkan policy insert Storage tambahan untuk jalur ini. URL publik hanya memberi akses baca; kunci service-role tidak pernah dikirim ke browser.

## Data yang sudah ada

File lokal lama tidak otomatis dipindahkan. Nilai `/uploads/...` di PostgreSQL tetap menunjuk ke disk aplikasi/Laragon sampai file diunggah ulang atau dilakukan migrasi terpisah. Upload baru akan menghasilkan URL Supabase.
