import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { z } from 'zod';

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const respondentCodeSchema = z.string()
  .trim()
  .min(1, 'Respondent code is required')
  .max(50, 'Respondent code must be less than 50 characters')
  .regex(/^[a-zA-Z0-9\-_]+$/, 'Only letters, numbers, hyphens, and underscores allowed');

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'ms', label: 'Bahasa Melayu' },
];

export function CreateSessionDialog({ open, onOpenChange }: CreateSessionDialogProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [respondentCode, setRespondentCode] = useState('');
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate respondent code
    const validation = respondentCodeSchema.safeParse(respondentCode);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    if (!user) {
      setError('You must be logged in to create a session');
      return;
    }

    setLoading(true);
    try {
      // Check if respondent code already exists for this interviewer
      const { data: existing } = await supabase
        .from('interview_sessions')
        .select('id')
        .eq('interviewer_id', user.id)
        .eq('respondent_code', respondentCode.trim())
        .maybeSingle();

      if (existing) {
        setError('A session with this respondent code already exists');
        setLoading(false);
        return;
      }

      // Create new session
      const { data: session, error: insertError } = await supabase
        .from('interview_sessions')
        .insert({
          interviewer_id: user.id,
          respondent_code: respondentCode.trim(),
          language: language,
          status: 'in_progress',
          current_step: 'consent',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Close dialog and navigate to interview with session ID
      onOpenChange(false);
      setRespondentCode('');
      navigate(`/interview?resume=${session.id}`);
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setRespondentCode('');
        setError(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Create New Session</DialogTitle>
          <DialogDescription>
            Enter the respondent details to start a new interview session.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="respondentCode">Respondent Code *</Label>
            <Input
              id="respondentCode"
              placeholder="e.g., RESP-001"
              value={respondentCode}
              onChange={(e) => {
                setRespondentCode(e.target.value);
                setError(null);
              }}
              disabled={loading}
              className="font-mono"
              autoComplete="off"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier for this respondent (letters, numbers, hyphens, underscores)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Interview Language</Label>
            <Select value={language} onValueChange={setLanguage} disabled={loading}>
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !respondentCode.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Start Interview'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
