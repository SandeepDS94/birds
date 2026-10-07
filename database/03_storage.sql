-- ==============================================================================
-- 03_storage.sql
-- Storage Configuration & Policies for Private 'bird-audio' Bucket
-- ==============================================================================

-- 1. Create the private 'bird-audio' storage bucket if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'bird-audio',
    'bird-audio',
    false, -- Private bucket (playback requires signed URLs)
    26214400, -- 25 MB max limit
    ARRAY['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/flac', 'audio/mp4', 'audio/x-m4a', 'audio/webm']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 26214400,
    allowed_mime_types = ARRAY['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/flac', 'audio/mp4', 'audio/x-m4a', 'audio/webm'];

-- 2. Storage RLS Policies on storage.objects

-- Allow users to view their own files in the bird-audio bucket
DROP POLICY IF EXISTS "Users can read own audio files" ON storage.objects;
CREATE POLICY "Users can read own audio files"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'bird-audio' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to insert audio files into their own folder ({user_id}/*)
DROP POLICY IF EXISTS "Users can upload own audio files" ON storage.objects;
CREATE POLICY "Users can upload own audio files"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'bird-audio' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to delete their own audio files
DROP POLICY IF EXISTS "Users can delete own audio files" ON storage.objects;
CREATE POLICY "Users can delete own audio files"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'bird-audio' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
