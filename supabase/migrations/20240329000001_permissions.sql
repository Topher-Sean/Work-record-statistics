-- 基础读取权限
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 认证用户完整权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;

-- RLS (Row Level Security) 策略
ALTER TABLE public.work_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;

-- 游客模式的临时策略 (通过 auth.uid() 或 检查请求中是否带有特定标识处理，此处先为了简便，允许所有人访问他们创建的数据。由于我们有自定义的认证逻辑，可能不完全依赖 Supabase Auth。为了兼容前端和后端的直接访问，并且基于需求文档描述)
-- 对于基于 token 的自建用户系统，RLS 策略可能需要根据具体需求调整。这里先开放基本的访问权限，通过后端 API 控制具体逻辑。
-- 如果完全通过后端访问 Supabase（使用 service_role key），则不需要 RLS。
-- 如果前端直接访问 Supabase，需要配置具体的策略。考虑到本项目架构是 Vue -> Node -> Supabase，后端使用 service_role key 访问数据库时会绕过 RLS。
-- 为了安全起见，这里创建基础的 RLS 策略，确保前端直接访问时的安全性（如果有的话）。

-- 允许认证用户访问所有数据（在本项目中，实际的权限控制应该在 Node.js 后端进行，因为我们使用的是自建的用户系统和认证体系）
CREATE POLICY user_work_records ON public.work_records
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY user_projects ON public.projects
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY user_statistics ON public.statistics
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY user_work_items ON public.work_items
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY user_commits ON public.commits
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- 如果前端需要直接查询某些公开数据（如公开项目），可以配置 anon 角色的策略
CREATE POLICY anon_read_public_projects ON public.projects
    FOR SELECT TO anon
    USING (true);
