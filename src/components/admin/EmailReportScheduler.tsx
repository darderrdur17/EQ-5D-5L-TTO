import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Mail, 
  Plus, 
  Trash2, 
  Clock,
  Loader2,
  Send,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface EmailSchedule {
  id: string;
  admin_id: string;
  schedule_type: string;
  email_address: string;
  is_active: boolean;
  last_sent_at: string | null;
  created_at: string;
}

export function EmailReportScheduler() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<EmailSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState<string | null>(null);
  
  // Form state
  const [scheduleType, setScheduleType] = useState('weekly');
  const [emailAddress, setEmailAddress] = useState('');

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_report_schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load email schedules',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleCreateSchedule = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter a valid email address',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('email_report_schedules')
        .insert({
          admin_id: user?.id,
          schedule_type: scheduleType,
          email_address: emailAddress,
        });

      if (error) throw error;

      toast({
        title: 'Schedule Created',
        description: `${scheduleType === 'weekly' ? 'Weekly' : 'Monthly'} reports will be sent to ${emailAddress}`,
      });

      setEmailAddress('');
      fetchSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create email schedule',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (schedule: EmailSchedule) => {
    try {
      const { error } = await supabase
        .from('email_report_schedules')
        .update({ is_active: !schedule.is_active })
        .eq('id', schedule.id);

      if (error) throw error;

      setSchedules(schedules.map(s => 
        s.id === schedule.id ? { ...s, is_active: !s.is_active } : s
      ));

      toast({
        title: schedule.is_active ? 'Schedule Paused' : 'Schedule Activated',
        description: schedule.is_active 
          ? 'Email reports have been paused'
          : 'Email reports have been activated',
      });
    } catch (error) {
      console.error('Error toggling schedule:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update schedule',
      });
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_report_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSchedules(schedules.filter(s => s.id !== id));
      toast({
        title: 'Schedule Deleted',
        description: 'Email schedule has been removed',
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete schedule',
      });
    }
  };

  const handleSendTestEmail = async (schedule: EmailSchedule) => {
    setSendingTest(schedule.id);
    try {
      const { error } = await supabase.functions.invoke('send-performance-report', {
        body: {
          scheduleId: schedule.id,
          isTest: true,
        },
      });

      if (error) throw error;

      toast({
        title: 'Test Email Sent',
        description: `A test report has been sent to ${schedule.email_address}`,
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send test email. Make sure RESEND_API_KEY is configured.',
      });
    } finally {
      setSendingTest(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Schedule Performance Reports
          </CardTitle>
          <CardDescription>
            Automatically send performance summaries to administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <div className="w-full sm:w-40 space-y-2">
              <Label>Frequency</Label>
              <Select value={scheduleType} onValueChange={setScheduleType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateSchedule} disabled={saving} className="gap-2 w-full sm:w-auto">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add Schedule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Schedules */}
      {schedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No email schedules configured. Add one to receive automatic reports.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Schedules</CardTitle>
            <CardDescription>Manage your email report subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div 
                  key={schedule.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      schedule.is_active ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Mail className={`h-5 w-5 ${
                        schedule.is_active ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{schedule.email_address}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="capitalize">
                          {schedule.schedule_type}
                        </Badge>
                        {schedule.last_sent_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last sent: {format(new Date(schedule.last_sent_at), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={schedule.is_active}
                        onCheckedChange={() => handleToggleActive(schedule)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {schedule.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleSendTestEmail(schedule)}
                      disabled={sendingTest === schedule.id}
                    >
                      {sendingTest === schedule.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Test
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-info" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Report Schedule</h4>
              <p className="text-sm text-muted-foreground">
                <strong>Weekly reports</strong> are sent every Monday morning with the previous week's performance data. 
                <strong> Monthly reports</strong> are sent on the 1st of each month with the previous month's summary.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
