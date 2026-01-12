import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Flag, 
  Clock,
  Loader2 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { notifyQualityUpdate } from '@/utils/notifications';

interface QualityReviewPanelProps {
  sessionId: string;
  currentStatus: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  qualityNotes?: string | null;
  onStatusChange?: () => void;
}

export function QualityReviewPanel({
  sessionId,
  currentStatus,
  reviewedBy,
  reviewedAt,
  qualityNotes,
  onStatusChange,
}: QualityReviewPanelProps) {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState(qualityNotes || '');
  const [saving, setSaving] = useState(false);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!user || !isAdmin) return;

    setSaving(true);
    try {
      // Get session details for notification
      const { data: session } = await supabase
        .from('interview_sessions')
        .select('respondent_code, interviewer_id')
        .eq('id', sessionId)
        .single();

      const { error } = await supabase
        .from('interview_sessions')
        .update({
          quality_status: newStatus,
          quality_reviewed_by: user.id,
          quality_reviewed_at: new Date().toISOString(),
          quality_notes: notes.trim() || null,
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Send notification to interviewer
      if (session) {
        notifyQualityUpdate(
          sessionId,
          session.respondent_code,
          session.interviewer_id,
          newStatus,
          notes.trim() || undefined
        );
      }

      toast({
        title: 'Review Updated',
        description: `Session marked as ${newStatus}.`,
      });
      onStatusChange?.();
    } catch (error) {
      console.error('Error updating quality status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update review status.',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'flagged':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Flag className="h-3 w-3 mr-1" />
            Flagged
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
    }
  };

  if (!isAdmin) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Shield className="h-5 w-5" />
          Quality Review
        </CardTitle>
        <CardDescription>
          Review and flag session data quality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Current Status</span>
          {getStatusBadge(currentStatus)}
        </div>

        {/* Review Info */}
        {reviewedAt && (
          <div className="text-sm text-muted-foreground">
            Last reviewed: {format(new Date(reviewedAt), 'MMM dd, yyyy HH:mm')}
          </div>
        )}

        {/* Review Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Review Notes</label>
          <Textarea
            placeholder="Add notes about data quality issues, concerns, or observations..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleUpdateStatus('approved')}
            disabled={saving}
            className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Approve
          </Button>
          <Button
            onClick={() => handleUpdateStatus('flagged')}
            disabled={saving}
            variant="outline"
            className="gap-2 border-warning text-warning hover:bg-warning/10"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Flag className="h-4 w-4" />
            )}
            Flag for Review
          </Button>
          <Button
            onClick={() => handleUpdateStatus('rejected')}
            disabled={saving}
            variant="outline"
            className="gap-2 border-destructive text-destructive hover:bg-destructive/10"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
