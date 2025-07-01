-- Enhanced Media Files Table for Cloudflare R2 Video Storage
-- This migration enhances the existing media_files table to better support videos

-- Add new columns for video-specific metadata
ALTER TABLE media_files 
ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(20) DEFAULT 'r2' CHECK (storage_provider IN ('r2', 'gcs', 'local')),
ADD COLUMN IF NOT EXISTS storage_key TEXT, -- R2 key or GCS path
ADD COLUMN IF NOT EXISTS public_url TEXT, -- Direct public URL for R2 videos
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER, -- Video duration in seconds
ADD COLUMN IF NOT EXISTS width INTEGER, -- Video width in pixels
ADD COLUMN IF NOT EXISTS height INTEGER, -- Video height in pixels
ADD COLUMN IF NOT EXISTS aspect_ratio VARCHAR(10), -- e.g., '16:9', '9:16', '1:1'
ADD COLUMN IF NOT EXISTS frame_rate INTEGER DEFAULT 24, -- Frames per second
ADD COLUMN IF NOT EXISTS video_codec VARCHAR(20), -- e.g., 'h264', 'h265'
ADD COLUMN IF NOT EXISTS audio_codec VARCHAR(20), -- e.g., 'aac', 'mp3'
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT, -- Thumbnail image URL
ADD COLUMN IF NOT EXISTS thumbnail_key TEXT, -- R2 key for thumbnail
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'completed' CHECK (processing_status IN ('processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS ai_model VARCHAR(50), -- e.g., 'seedance-1-0-lite-t2v-250428', 'google-veo'
ADD COLUMN IF NOT EXISTS generation_prompt TEXT, -- Original prompt used for generation
ADD COLUMN IF NOT EXISTS generation_options JSONB; -- Additional generation parameters

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_files_storage_provider ON media_files(storage_provider);
CREATE INDEX IF NOT EXISTS idx_media_files_mime_type ON media_files(mime_type);
CREATE INDEX IF NOT EXISTS idx_media_files_processing_status ON media_files(processing_status);
CREATE INDEX IF NOT EXISTS idx_media_files_ai_model ON media_files(ai_model);
CREATE INDEX IF NOT EXISTS idx_media_files_user_created ON media_files(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_files_generation_id ON media_files(generation_id);

-- Add comments for documentation
COMMENT ON COLUMN media_files.storage_provider IS 'Storage provider: r2 for Cloudflare R2, gcs for Google Cloud Storage';
COMMENT ON COLUMN media_files.storage_key IS 'Storage key/path: R2 object key or GCS path';
COMMENT ON COLUMN media_files.public_url IS 'Direct public URL for accessing the file';
COMMENT ON COLUMN media_files.duration_seconds IS 'Video duration in seconds';
COMMENT ON COLUMN media_files.aspect_ratio IS 'Video aspect ratio (e.g., 16:9, 9:16, 1:1)';
COMMENT ON COLUMN media_files.ai_model IS 'AI model used for generation (e.g., seedance-1-0-lite-t2v-250428)';
COMMENT ON COLUMN media_files.generation_prompt IS 'Original text prompt used for video generation';
COMMENT ON COLUMN media_files.generation_options IS 'JSON object containing generation parameters';

-- Update existing records to set default values
UPDATE media_files 
SET storage_provider = CASE 
    WHEN file_path LIKE 'gs://%' THEN 'gcs'
    WHEN file_path LIKE 'https://%.r2.%' THEN 'r2'
    WHEN file_path LIKE 'https://%.cloudflarestorage.com%' THEN 'r2'
    ELSE 'r2'
END
WHERE storage_provider IS NULL;

-- Extract storage keys from existing file paths
UPDATE media_files 
SET storage_key = CASE 
    WHEN storage_provider = 'gcs' AND file_path LIKE 'gs://%' THEN 
        SUBSTRING(file_path FROM 'gs://[^/]+/(.+)')
    WHEN storage_provider = 'r2' AND file_path LIKE '%cloudflarestorage.com/%' THEN 
        SPLIT_PART(SPLIT_PART(file_path, '.com/', 2), '?', 1)
    ELSE NULL
END
WHERE storage_key IS NULL;

-- Set AI model for existing ByteDance videos
UPDATE media_files 
SET ai_model = 'seedance-1-0-lite-t2v-250428'
WHERE mime_type = 'video/mp4' 
  AND storage_provider = 'r2' 
  AND ai_model IS NULL
  AND (metadata->>'provider' = 'bytedance' OR metadata->>'service' = 'bytedance');

-- Set AI model for existing Google Veo videos  
UPDATE media_files 
SET ai_model = 'google-veo'
WHERE mime_type = 'video/mp4' 
  AND storage_provider = 'gcs' 
  AND ai_model IS NULL
  AND (metadata->>'provider' = 'google-veo' OR metadata->>'service' = 'vertex');
