
-- Table to store the last fetched job listings
CREATE TABLE public.cached_jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  is_remote BOOLEAN NOT NULL DEFAULT false,
  is_hybrid BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  required_skills TEXT[] DEFAULT '{}',
  salary_min INTEGER,
  salary_max INTEGER,
  posted_date TIMESTAMPTZ,
  apply_link TEXT,
  source TEXT,
  match_score INTEGER DEFAULT 0,
  priority_score INTEGER DEFAULT 0,
  competition_level TEXT DEFAULT 'medium',
  visa_status TEXT DEFAULT 'unknown',
  timing_tag TEXT DEFAULT 'recent',
  strong_match_skills TEXT[] DEFAULT '{}',
  partial_match_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  industry TEXT,
  seniority TEXT,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table to track when jobs were last fetched from Firecrawl
CREATE TABLE public.job_cache_meta (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_fetched_at TIMESTAMPTZ,
  total_jobs INTEGER DEFAULT 0
);

-- Seed the meta row
INSERT INTO public.job_cache_meta (id, last_fetched_at, total_jobs) VALUES (1, NULL, 0);

-- Enable RLS
ALTER TABLE public.cached_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_cache_meta ENABLE ROW LEVEL SECURITY;

-- Public read access for job listings
CREATE POLICY "Anyone can read cached jobs" ON public.cached_jobs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert cached jobs" ON public.cached_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update cached jobs" ON public.cached_jobs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete cached jobs" ON public.cached_jobs FOR DELETE USING (true);

-- Public read access for cache meta
CREATE POLICY "Anyone can read job cache meta" ON public.job_cache_meta FOR SELECT USING (true);
CREATE POLICY "Anyone can update cache meta" ON public.job_cache_meta FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert cache meta" ON public.job_cache_meta FOR INSERT WITH CHECK (true);
