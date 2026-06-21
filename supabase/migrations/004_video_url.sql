-- 1. Add video_url column
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS video_url text;

-- 2. Create public storage bucket "videos"
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Allow anonymous uploads (collect page is public, no auth required)
DROP POLICY IF EXISTS "Allow anonymous uploads to videos" ON storage.objects;
CREATE POLICY "Allow anonymous uploads to videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos');

-- 4. Allow public reads (wall + dashboard need to stream videos)
DROP POLICY IF EXISTS "Allow public reads from videos" ON storage.objects;
CREATE POLICY "Allow public reads from videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');
