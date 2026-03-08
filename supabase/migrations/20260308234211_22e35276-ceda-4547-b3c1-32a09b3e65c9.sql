-- Profiles table to persist candidate data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  current_title TEXT,
  summary TEXT,
  skills TEXT[] DEFAULT '{}',
  tools TEXT[] DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',
  desired_titles TEXT[] DEFAULT '{}',
  preferred_locations TEXT[] DEFAULT '{}',
  remote_preference TEXT DEFAULT 'flexible',
  salary_min INTEGER DEFAULT 0,
  salary_max INTEGER DEFAULT 0,
  requires_visa_sponsorship BOOLEAN DEFAULT false,
  years_of_experience INTEGER DEFAULT 0,
  resume_file_name TEXT,
  resume_file_path TEXT,
  experience JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

CREATE POLICY "Users can upload their own resume" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own resume" ON storage.objects
FOR SELECT USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own resume" ON storage.objects
FOR DELETE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);