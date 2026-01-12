import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Target, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface PerformanceGoal {
  id: string;
  interviewer_id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  period_start: string;
  period_end: string;
  status: string;
  interviewer_name?: string;
}

interface Interviewer {
  id: string;
  full_name: string;
  email: string;
}

const GOAL_TYPES = [
  { value: 'sessions_per_week', label: 'Sessions per Week', unit: 'sessions' },
  { value: 'sessions_per_month', label: 'Sessions per Month', unit: 'sessions' },
  { value: 'completion_rate', label: 'Completion Rate', unit: '%' },
  { value: 'approval_rate', label: 'Approval Rate', unit: '%' },
];

export function PerformanceGoals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [selectedInterviewer, setSelectedInterviewer] = useState('');
  const [goalType, setGoalType] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [periodType, setPeriodType] = useState<'week' | 'month'>('week');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch interviewers
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email');

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const interviewerIds = roles?.filter(r => r.role === 'interviewer').map(r => r.user_id) || [];
      const filteredInterviewers = profiles?.filter(p => interviewerIds.includes(p.id)) || [];
      setInterviewers(filteredInterviewers.map(p => ({
        id: p.id,
        full_name: p.full_name || p.email,
        email: p.email,
      })));

      // Fetch goals with calculated current values
      const { data: goalsData, error: goalsError } = await supabase
        .from('performance_goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;

      // Enrich goals with interviewer names and current values
      const enrichedGoals = await Promise.all(
        (goalsData || []).map(async (goal) => {
          const interviewer = filteredInterviewers.find(i => i.id === goal.interviewer_id);
          const currentValue = await calculateCurrentValue(goal);
          
          return {
            ...goal,
            interviewer_name: interviewer?.full_name || interviewer?.email || 'Unknown',
            current_value: currentValue,
          };
        })
      );

      setGoals(enrichedGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load performance goals',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentValue = async (goal: PerformanceGoal): Promise<number> => {
    const { data: sessions } = await supabase
      .from('interview_sessions')
      .select('id, status, quality_status')
      .eq('interviewer_id', goal.interviewer_id)
      .gte('started_at', goal.period_start)
      .lte('started_at', goal.period_end);

    if (!sessions || sessions.length === 0) return 0;

    switch (goal.goal_type) {
      case 'sessions_per_week':
      case 'sessions_per_month':
        return sessions.length;
      case 'completion_rate':
        const completed = sessions.filter(s => s.status === 'completed').length;
        return Math.round((completed / sessions.length) * 100);
      case 'approval_rate':
        const approved = sessions.filter(s => s.quality_status === 'approved').length;
        const completedForApproval = sessions.filter(s => s.status === 'completed').length;
        return completedForApproval > 0 ? Math.round((approved / completedForApproval) * 100) : 0;
      default:
        return 0;
    }
  };

  const handleCreateGoal = async () => {
    if (!selectedInterviewer || !goalType || !targetValue) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all fields',
      });
      return;
    }

    setSaving(true);
    try {
      const now = new Date();
      let periodStart: Date, periodEnd: Date;

      if (periodType === 'week') {
        periodStart = startOfWeek(now, { weekStartsOn: 1 });
        periodEnd = endOfWeek(now, { weekStartsOn: 1 });
      } else {
        periodStart = startOfMonth(now);
        periodEnd = endOfMonth(now);
      }

      const { error } = await supabase
        .from('performance_goals')
        .insert({
          interviewer_id: selectedInterviewer,
          goal_type: goalType,
          target_value: parseFloat(targetValue),
          period_start: format(periodStart, 'yyyy-MM-dd'),
          period_end: format(periodEnd, 'yyyy-MM-dd'),
        });

      if (error) throw error;

      toast({
        title: 'Goal Created',
        description: 'Performance goal has been set successfully',
      });

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create performance goal',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('performance_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      toast({
        title: 'Goal Deleted',
        description: 'Performance goal has been removed',
      });

      setGoals(goals.filter(g => g.id !== goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete goal',
      });
    }
  };

  const resetForm = () => {
    setSelectedInterviewer('');
    setGoalType('');
    setTargetValue('');
    setPeriodType('week');
  };

  const getGoalProgress = (goal: PerformanceGoal) => {
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  const getGoalStatus = (goal: PerformanceGoal) => {
    const progress = getGoalProgress(goal);
    const now = new Date();
    const endDate = new Date(goal.period_end);
    
    if (progress >= 100) {
      return { label: 'Achieved', variant: 'success' as const, icon: CheckCircle2 };
    }
    if (now > endDate && progress < 100) {
      return { label: 'Failed', variant: 'destructive' as const, icon: AlertTriangle };
    }
    if (progress >= 70) {
      return { label: 'On Track', variant: 'default' as const, icon: TrendingUp };
    }
    return { label: 'At Risk', variant: 'warning' as const, icon: Clock };
  };

  const getGoalTypeLabel = (type: string) => {
    return GOAL_TYPES.find(t => t.value === type)?.label || type;
  };

  const getGoalUnit = (type: string) => {
    return GOAL_TYPES.find(t => t.value === type)?.unit || '';
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Performance Goals</h2>
          <p className="text-sm text-muted-foreground">Set and track targets for interviewers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Performance Goal</DialogTitle>
              <DialogDescription>
                Set a new performance target for an interviewer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Interviewer</Label>
                <Select value={selectedInterviewer} onValueChange={setSelectedInterviewer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {interviewers.map((interviewer) => (
                      <SelectItem key={interviewer.id} value={interviewer.id}>
                        {interviewer.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Goal Type</Label>
                <Select value={goalType} onValueChange={setGoalType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Value</Label>
                <Input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={goalType?.includes('rate') ? 'e.g., 90' : 'e.g., 10'}
                />
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select value={periodType} onValueChange={(v) => setPeriodType(v as 'week' | 'month')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGoal} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Goal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No performance goals set yet. Create one to start tracking progress.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const status = getGoalStatus(goal);
            const StatusIcon = status.icon;
            const progress = getGoalProgress(goal);

            return (
              <Card key={goal.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-medium">
                        {goal.interviewer_name}
                      </CardTitle>
                      <CardDescription>{getGoalTypeLabel(goal.goal_type)}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {goal.current_value}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        / {goal.target_value} {getGoalUnit(goal.goal_type)}
                      </span>
                    </span>
                    <Badge 
                      variant="outline"
                      className={`gap-1 ${
                        status.variant === 'success' ? 'bg-success/10 text-success border-success/20' :
                        status.variant === 'destructive' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                        status.variant === 'warning' ? 'bg-warning/10 text-warning border-warning/20' :
                        'bg-primary/10 text-primary border-primary/20'
                      }`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(goal.period_start), 'MMM dd')} - {format(new Date(goal.period_end), 'MMM dd, yyyy')}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
