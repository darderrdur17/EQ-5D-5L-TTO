-- Create session_notes table for interviewer comments/observations
CREATE TABLE public.session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;

-- Policies for session notes
CREATE POLICY "Interviewers can create notes for their sessions"
ON public.session_notes
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM interview_sessions
  WHERE interview_sessions.id = session_notes.session_id
  AND interview_sessions.interviewer_id = auth.uid()
));

CREATE POLICY "Interviewers can view notes for their sessions"
ON public.session_notes
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM interview_sessions
  WHERE interview_sessions.id = session_notes.session_id
  AND interview_sessions.interviewer_id = auth.uid()
));

CREATE POLICY "Interviewers can update their own notes"
ON public.session_notes
FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Interviewers can delete their own notes"
ON public.session_notes
FOR DELETE
USING (created_by = auth.uid());

CREATE POLICY "Admins can view all notes"
ON public.session_notes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add quality review columns to interview_sessions
ALTER TABLE public.interview_sessions 
ADD COLUMN IF NOT EXISTS quality_status text DEFAULT 'pending' CHECK (quality_status IN ('pending', 'approved', 'flagged', 'rejected')),
ADD COLUMN IF NOT EXISTS quality_reviewed_by uuid,
ADD COLUMN IF NOT EXISTS quality_reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS quality_notes text;

-- Create policy for admins to update quality status
CREATE POLICY "Admins can update session quality status"
ON public.interview_sessions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger for session_notes
CREATE TRIGGER update_session_notes_updated_at
  BEFORE UPDATE ON public.session_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();