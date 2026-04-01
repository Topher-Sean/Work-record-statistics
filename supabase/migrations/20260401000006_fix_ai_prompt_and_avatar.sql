-- Ensure users table has ai_prompt and avatar_url fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS ai_prompt TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS ai_prompt_config JSONB;
