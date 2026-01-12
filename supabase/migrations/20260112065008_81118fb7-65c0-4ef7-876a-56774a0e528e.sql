-- Create performance goals table
CREATE TABLE public.performance_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interviewer_id UUID NOT NULL,
  goal_type TEXT NOT NULL, -- 'sessions_per_week', 'completion_rate', 'approval_rate'
  target_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email report schedules table
CREATE TABLE public.email_report_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  schedule_type TEXT NOT NULL, -- 'weekly', 'monthly'
  email_address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create performance alerts table
CREATE TABLE public.performance_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interviewer_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- 'goal_at_risk', 'goal_achieved', 'low_performance'
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.performance_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for performance_goals
CREATE POLICY "Admins can view all goals" ON public.performance_goals
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create goals" ON public.performance_goals
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update goals" ON public.performance_goals
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete goals" ON public.performance_goals
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Interviewers can view their own goals" ON public.performance_goals
FOR SELECT USING (auth.uid() = interviewer_id);

-- RLS Policies for email_report_schedules
CREATE POLICY "Admins can manage report schedules" ON public.email_report_schedules
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for performance_alerts
CREATE POLICY "Admins can view all alerts" ON public.performance_alerts
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Interviewers can view their own alerts" ON public.performance_alerts
FOR SELECT USING (auth.uid() = interviewer_id);

CREATE POLICY "Admins can create alerts" ON public.performance_alerts
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own alerts" ON public.performance_alerts
FOR UPDATE USING (auth.uid() = interviewer_id);

-- Create trigger for updated_at
CREATE TRIGGER update_performance_goals_updated_at
BEFORE UPDATE ON public.performance_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_report_schedules_updated_at
BEFORE UPDATE ON public.email_report_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();