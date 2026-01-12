-- Create profiles table for user accounts
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'interviewer' CHECK (role IN ('admin', 'interviewer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create interview sessions table
CREATE TABLE public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  respondent_code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  current_step TEXT NOT NULL DEFAULT 'consent',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Interviewers can view their own sessions" ON public.interview_sessions FOR SELECT USING (auth.uid() = interviewer_id);
CREATE POLICY "Interviewers can create sessions" ON public.interview_sessions FOR INSERT WITH CHECK (auth.uid() = interviewer_id);
CREATE POLICY "Interviewers can update their own sessions" ON public.interview_sessions FOR UPDATE USING (auth.uid() = interviewer_id);
CREATE POLICY "Admins can view all sessions" ON public.interview_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create EQ-5D-5L responses table (warm-up questionnaire)
CREATE TABLE public.eq5d_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  mobility INTEGER NOT NULL CHECK (mobility BETWEEN 1 AND 5),
  self_care INTEGER NOT NULL CHECK (self_care BETWEEN 1 AND 5),
  usual_activities INTEGER NOT NULL CHECK (usual_activities BETWEEN 1 AND 5),
  pain_discomfort INTEGER NOT NULL CHECK (pain_discomfort BETWEEN 1 AND 5),
  anxiety_depression INTEGER NOT NULL CHECK (anxiety_depression BETWEEN 1 AND 5),
  vas_score INTEGER CHECK (vas_score BETWEEN 0 AND 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.eq5d_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses for their sessions" ON public.eq5d_responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.interview_sessions WHERE id = session_id AND interviewer_id = auth.uid())
);
CREATE POLICY "Users can create responses for their sessions" ON public.eq5d_responses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.interview_sessions WHERE id = session_id AND interviewer_id = auth.uid())
);
CREATE POLICY "Admins can view all eq5d responses" ON public.eq5d_responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create TTO responses table
CREATE TABLE public.tto_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  health_state TEXT NOT NULL,
  task_number INTEGER NOT NULL CHECK (task_number BETWEEN 1 AND 10),
  final_value DECIMAL(4,3) NOT NULL,
  is_worse_than_death BOOLEAN NOT NULL DEFAULT false,
  lead_time_value DECIMAL(4,3),
  time_spent_seconds INTEGER,
  moves_count INTEGER,
  flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tto_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view TTO responses for their sessions" ON public.tto_responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.interview_sessions WHERE id = session_id AND interviewer_id = auth.uid())
);
CREATE POLICY "Users can create TTO responses for their sessions" ON public.tto_responses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.interview_sessions WHERE id = session_id AND interviewer_id = auth.uid())
);
CREATE POLICY "Admins can view all TTO responses" ON public.tto_responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create DCE responses table
CREATE TABLE public.dce_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  task_number INTEGER NOT NULL CHECK (task_number BETWEEN 1 AND 7),
  state_a TEXT NOT NULL,
  state_b TEXT NOT NULL,
  chosen_state TEXT NOT NULL CHECK (chosen_state IN ('A', 'B')),
  time_spent_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dce_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view DCE responses for their sessions" ON public.dce_responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.interview_sessions WHERE id = session_id AND interviewer_id = auth.uid())
);
CREATE POLICY "Users can create DCE responses for their sessions" ON public.dce_responses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.interview_sessions WHERE id = session_id AND interviewer_id = auth.uid())
);
CREATE POLICY "Admins can view all DCE responses" ON public.dce_responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create demographics table
CREATE TABLE public.demographics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE UNIQUE,
  age INTEGER,
  gender TEXT,
  education TEXT,
  employment TEXT,
  marital_status TEXT,
  ethnicity TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.demographics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view demographics for their sessions" ON public.demographics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.interview_sessions WHERE id = session_id AND interviewer_id = auth.uid())
);
CREATE POLICY "Users can create demographics for their sessions" ON public.demographics FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.interview_sessions WHERE id = session_id AND interviewer_id = auth.uid())
);
CREATE POLICY "Admins can view all demographics" ON public.demographics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create AI copilot logs table
CREATE TABLE public.ai_copilot_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  stage TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_copilot_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI logs for their sessions" ON public.ai_copilot_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.interview_sessions WHERE id = session_id AND interviewer_id = auth.uid())
);
CREATE POLICY "Users can create AI logs for their sessions" ON public.ai_copilot_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.interview_sessions WHERE id = session_id AND interviewer_id = auth.uid())
);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'interviewer')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_interview_sessions_updated_at BEFORE UPDATE ON public.interview_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();