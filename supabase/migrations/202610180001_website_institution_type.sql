-- Store the institution category independently from the selected visual template.
ALTER TABLE public.websites
  ADD COLUMN IF NOT EXISTS institution_type text;

UPDATE public.websites w
SET institution_type = t.slug
FROM public.templates t
WHERE w.template_id = t.id
  AND w.institution_type IS NULL;

UPDATE public.websites
SET institution_type = 'dinas'
WHERE institution_type IS NULL;

ALTER TABLE public.websites
  ALTER COLUMN institution_type SET NOT NULL,
  ALTER COLUMN institution_type SET DEFAULT 'dinas';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'websites_institution_type_check'
  ) THEN
    ALTER TABLE public.websites
      ADD CONSTRAINT websites_institution_type_check
      CHECK (institution_type IN ('dinas', 'kecamatan', 'kelurahan'));
  END IF;
END $$;
