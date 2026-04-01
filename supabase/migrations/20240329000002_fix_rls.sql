-- Drop existing policies if any
DROP POLICY IF EXISTS "user_work_records" ON public.work_records;
DROP POLICY IF EXISTS "user_projects" ON public.projects;
DROP POLICY IF EXISTS "user_statistics" ON public.statistics;
DROP POLICY IF EXISTS "user_work_items" ON public.work_items;
DROP POLICY IF EXISTS "user_commits" ON public.commits;
DROP POLICY IF EXISTS "anon_read_public_projects" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.projects;

-- Enable RLS
ALTER TABLE public.work_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commits ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own projects
CREATE POLICY "Users can manage their own projects" ON public.projects
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to manage their own work records
CREATE POLICY "Users can manage their own work records" ON public.work_records
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to manage their own statistics
CREATE POLICY "Users can manage their own statistics" ON public.statistics
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Since work_items and commits don't have user_id, they rely on record_id. 
-- In a strict setup, we'd join to check ownership, but for simplicity here we can allow authenticated users to manage them.
-- A more secure way is to use a subquery in the USING clause.
CREATE POLICY "Users can manage work items of their records" ON public.work_items
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.work_records 
        WHERE work_records.id = work_items.record_id AND work_records.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.work_records 
        WHERE work_records.id = work_items.record_id AND work_records.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage commits of their records" ON public.commits
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.work_records 
        WHERE work_records.id = commits.record_id AND work_records.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.work_records 
        WHERE work_records.id = commits.record_id AND work_records.user_id = auth.uid()
    ));
