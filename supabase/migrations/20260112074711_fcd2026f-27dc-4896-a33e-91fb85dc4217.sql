-- Fix security: Restrict profile access to own profile or admin
-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create proper RLS policies for profiles
-- Users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Admins can view all profiles (using the existing has_role function)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Fix security: Restrict email_report_schedules to admins only
DROP POLICY IF EXISTS "Admins can manage report schedules" ON public.email_report_schedules;

-- Admins can view their own schedules
CREATE POLICY "Admins can view own report schedules" 
ON public.email_report_schedules 
FOR SELECT 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') 
  AND admin_id = auth.uid()
);

-- Admins can insert their own schedules
CREATE POLICY "Admins can create own report schedules" 
ON public.email_report_schedules 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') 
  AND admin_id = auth.uid()
);

-- Admins can update their own schedules
CREATE POLICY "Admins can update own report schedules" 
ON public.email_report_schedules 
FOR UPDATE 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') 
  AND admin_id = auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') 
  AND admin_id = auth.uid()
);

-- Admins can delete their own schedules
CREATE POLICY "Admins can delete own report schedules" 
ON public.email_report_schedules 
FOR DELETE 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') 
  AND admin_id = auth.uid()
);