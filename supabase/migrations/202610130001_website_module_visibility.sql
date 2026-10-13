-- Per-website public visibility for content modules.
-- Missing rows mean enabled, so existing sites keep their current appearance.

CREATE TABLE IF NOT EXISTS public.website_module_settings AS
SELECT w.id AS website_id, ''::text AS module_slug, true::boolean AS is_enabled
FROM public.websites w
WITH NO DATA;

ALTER TABLE public.website_module_settings
  ALTER COLUMN website_id SET NOT NULL,
  ALTER COLUMN module_slug SET NOT NULL,
  ALTER COLUMN is_enabled SET DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'website_module_settings_pk') THEN
    ALTER TABLE public.website_module_settings
      ADD CONSTRAINT website_module_settings_pk PRIMARY KEY (website_id, module_slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'website_module_settings_website_fk') THEN
    ALTER TABLE public.website_module_settings
      ADD CONSTRAINT website_module_settings_website_fk
      FOREIGN KEY (website_id) REFERENCES public.websites(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'website_module_settings_slug_check') THEN
    ALTER TABLE public.website_module_settings
      ADD CONSTRAINT website_module_settings_slug_check CHECK (length(btrim(module_slug)) > 0);
  END IF;
END $$;

ALTER TABLE public.website_module_settings ENABLE ROW LEVEL SECURITY;
