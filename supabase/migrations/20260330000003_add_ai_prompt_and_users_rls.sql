ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS ai_prompt TEXT DEFAULT '';

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own profile" ON public.users;

CREATE POLICY "Users can manage their own profile" ON public.users
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
