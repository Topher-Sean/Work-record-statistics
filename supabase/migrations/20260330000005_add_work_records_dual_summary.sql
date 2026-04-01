ALTER TABLE public.work_records
ADD COLUMN IF NOT EXISTS code_summary TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS noncode_summary TEXT DEFAULT '';
