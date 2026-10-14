-- Extend curated news links into first-party articles while preserving existing imports.
ALTER TABLE public.news_items
  ALTER COLUMN url DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS category varchar(120),
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

UPDATE public.news_items
SET published_at = COALESCE(published_at, created_at)
WHERE is_published = true AND published_at IS NULL;

CREATE INDEX IF NOT EXISTS news_items_website_published_idx
  ON public.news_items (website_id, is_published, published_at DESC);
