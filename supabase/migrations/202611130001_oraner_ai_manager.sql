-- Optional artwork fields for public products and announcements.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS image_url TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_image_url_https_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_image_url_https_check
      CHECK (image_url IS NULL OR image_url ~* '^https://[^[:space:]]+$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'announcements_image_url_https_check'
      AND conrelid = 'public.announcements'::regclass
  ) THEN
    ALTER TABLE public.announcements
      ADD CONSTRAINT announcements_image_url_https_check
      CHECK (image_url IS NULL OR image_url ~* '^https://[^[:space:]]+$');
  END IF;
END $$;

-- Private queue of AI-generated advertising drafts awaiting a human decision.
CREATE TABLE IF NOT EXISTS public.ai_manager_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  body TEXT NOT NULL,
  image_prompt TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending_approval'
    CHECK (status IN ('pending_approval', 'published', 'rejected')),
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ai_manager_drafts_created_at_idx
  ON public.ai_manager_drafts (created_at DESC);
CREATE INDEX IF NOT EXISTS ai_manager_drafts_status_idx
  ON public.ai_manager_drafts (status);

-- Weekly reports contain database-backed metrics and an AI-written explanation.
CREATE TABLE IF NOT EXISTS public.ai_weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_key TEXT NOT NULL UNIQUE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  summary TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_weekly_reports_created_at_idx
  ON public.ai_weekly_reports (created_at DESC);

ALTER TABLE public.ai_manager_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_weekly_reports ENABLE ROW LEVEL SECURITY;

-- Only the server's service-role client reads/writes these private tables.
-- The public bucket exposes generated images by URL; uploads are performed server-side.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'oraner-public-assets',
  'oraner-public-assets',
  TRUE,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
