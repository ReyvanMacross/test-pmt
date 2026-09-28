-- AKUN DEVELOPMENT / LOKAL SAJA.
-- Pastikan public.users sudah dibuat dengan supabase_postgres_schema.sql.
-- Email: admin@diskominfo.local
-- Password: AdminLokal2026!
-- Hash di bawah dibuat menggunakan bcryptjs (cost 10), cocok dengan login aplikasi.
-- ON CONFLICT DO NOTHING menjaga agar menjalankan ulang file ini tidak mereset akun.
-- Jangan gunakan kredensial ini di internet atau production.

INSERT INTO public.users (name, email, password, role, instansi, permissions)
VALUES (
  'Administrator Lokal',
  'admin@diskominfo.local',
  '$2b$10$UgQO7WbPdd8/FhT/SHeCCONai2zBebwQOY84cy4wclP1d9alM5d9S',
  'super-admin',
  'Diskominfo Kota Bandung',
  '["manage-all-websites", "manage-templates", "manage-users", "view-all-logs"]'::jsonb
)
ON CONFLICT (email) DO NOTHING;
