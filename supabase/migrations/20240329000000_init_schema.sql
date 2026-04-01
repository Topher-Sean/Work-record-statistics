-- Enable uuid-ossp extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    nickname VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'normal' CHECK (role IN ('programmer', 'normal')),
    avatar_url TEXT,
    auth_providers JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#D4A5A5',
    repo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_active ON public.projects(is_active);

-- Work Records table
CREATE TABLE IF NOT EXISTS public.work_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    project_id UUID REFERENCES public.projects(id),
    summary TEXT,
    ai_generated BOOLEAN DEFAULT false,
    ai_analysis JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, record_date, project_id)
);

CREATE INDEX IF NOT EXISTS idx_work_records_user_date ON public.work_records(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_work_records_project ON public.work_records(project_id);

-- Work Items table
CREATE TABLE IF NOT EXISTS public.work_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID REFERENCES public.work_records(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 0,
    category VARCHAR(50),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_items_record_id ON public.work_items(record_id);

-- Commits table
CREATE TABLE IF NOT EXISTS public.commits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID REFERENCES public.work_records(id) ON DELETE CASCADE,
    commit_hash VARCHAR(40) NOT NULL,
    commit_message TEXT,
    commit_time TIMESTAMP WITH TIME ZONE,
    branch VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commits_record_id ON public.commits(record_id);
CREATE INDEX IF NOT EXISTS idx_commits_hash ON public.commits(commit_hash);

-- Statistics table
CREATE TABLE IF NOT EXISTS public.statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    period_type VARCHAR(10) CHECK (period_type IN ('day', 'week', 'month', 'year')),
    total_records INTEGER DEFAULT 0,
    total_duration INTEGER DEFAULT 0,
    project_stats JSONB DEFAULT '{}',
    category_stats JSONB DEFAULT '{}',
    ai_insights JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, stat_date, period_type)
);

CREATE INDEX IF NOT EXISTS idx_statistics_user_period ON public.statistics(user_id, period_type, stat_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_work_records_modtime
    BEFORE UPDATE ON public.work_records
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
