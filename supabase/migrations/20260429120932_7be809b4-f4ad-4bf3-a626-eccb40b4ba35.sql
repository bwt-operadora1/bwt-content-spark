CREATE TABLE IF NOT EXISTS public.content_archive (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signature TEXT NOT NULL UNIQUE,
  destination TEXT NOT NULL DEFAULT '',
  hotel TEXT NOT NULL DEFAULT '',
  agency TEXT,
  campaign TEXT,
  room_type TEXT,
  duration TEXT,
  start_date TEXT,
  end_date TEXT,
  total_price TEXT,
  installment_price TEXT,
  cash_price TEXT,
  outputs TEXT[] NOT NULL DEFAULT '{}',
  included_items TEXT[] NOT NULL DEFAULT '{}',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public archive records are viewable" ON public.content_archive;
DROP POLICY IF EXISTS "Public archive records can be created" ON public.content_archive;
DROP POLICY IF EXISTS "Public archive records can be updated" ON public.content_archive;
DROP POLICY IF EXISTS "Public archive records can be deleted" ON public.content_archive;

CREATE POLICY "Public archive records are viewable"
ON public.content_archive
FOR SELECT
USING (true);

CREATE POLICY "Public archive records can be created"
ON public.content_archive
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public archive records can be updated"
ON public.content_archive
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public archive records can be deleted"
ON public.content_archive
FOR DELETE
USING (true);

CREATE INDEX IF NOT EXISTS idx_content_archive_destination ON public.content_archive (destination);
CREATE INDEX IF NOT EXISTS idx_content_archive_hotel ON public.content_archive (hotel);
CREATE INDEX IF NOT EXISTS idx_content_archive_agency ON public.content_archive (agency);
CREATE INDEX IF NOT EXISTS idx_content_archive_updated_at ON public.content_archive (updated_at DESC);

CREATE OR REPLACE FUNCTION public.update_content_archive_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_content_archive_updated_at ON public.content_archive;
CREATE TRIGGER update_content_archive_updated_at
BEFORE UPDATE ON public.content_archive
FOR EACH ROW
EXECUTE FUNCTION public.update_content_archive_updated_at();