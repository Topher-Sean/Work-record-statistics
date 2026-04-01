-- 1. Clean up duplicate daily records to allow the new unique constraint
DELETE FROM public.work_records a USING (
    SELECT user_id, record_date, MAX(updated_at) as max_updated
    FROM public.work_records
    GROUP BY user_id, record_date
    HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id 
  AND a.record_date = b.record_date 
  AND a.updated_at < b.max_updated;

-- 2. Drop old unique constraint from work_records
ALTER TABLE public.work_records 
DROP CONSTRAINT IF EXISTS work_records_user_id_record_date_project_id_key,
DROP CONSTRAINT IF EXISTS work_records_user_id_record_date_key;

-- 3. Add the correct unique constraint: one record per user per day
ALTER TABLE public.work_records 
ADD CONSTRAINT work_records_user_id_record_date_key UNIQUE (user_id, record_date);

-- 4. Add project_id to commits and work_items for better relation modeling
ALTER TABLE public.commits
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);

ALTER TABLE public.work_items
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);
