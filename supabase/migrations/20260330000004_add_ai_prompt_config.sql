ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS ai_prompt_config JSONB;
