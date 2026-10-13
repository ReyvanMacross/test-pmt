-- Store structured extra fields for generic content modules, including leader rank.
-- Safe to run more than once on both Supabase and Laragon PostgreSQL.

ALTER TABLE public.contents
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.contents
SET metadata = '{}'::jsonb
WHERE metadata IS NULL;
