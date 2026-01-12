-- Fix security: Add policies to deny anonymous access to sensitive tables

-- Profiles table - deny anonymous access
CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Demographics table - deny anonymous access  
CREATE POLICY "Deny anonymous access to demographics" 
ON public.demographics 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Interview sessions - deny anonymous access
CREATE POLICY "Deny anonymous access to interview_sessions" 
ON public.interview_sessions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- EQ5D responses - deny anonymous access
CREATE POLICY "Deny anonymous access to eq5d_responses" 
ON public.eq5d_responses 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- TTO responses - deny anonymous access
CREATE POLICY "Deny anonymous access to tto_responses" 
ON public.tto_responses 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- DCE responses - deny anonymous access
CREATE POLICY "Deny anonymous access to dce_responses" 
ON public.dce_responses 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Session notes - deny anonymous access
CREATE POLICY "Deny anonymous access to session_notes" 
ON public.session_notes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Enable realtime for performance_alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_alerts;