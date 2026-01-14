import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { subDays, format, eachDayOfInterval } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface InterviewerData {
  id: string;
  name: string;
  email: string;
  color: string;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  approvalRate: number;
  avgDuration: number;
  flaggedCount: number;
}

interface DailyData {
  date: string;
  [key: string]: string | number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--info))',
  'hsl(142, 76%, 36%)',
  'hsl(280, 65%, 60%)',
  'hsl(200, 80%, 50%)',
  'hsl(350, 80%, 55%)',
];

export function PerformanceComparison() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [interviewers, setInterviewers] = useState<InterviewerData[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email');

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const interviewerIds = roles?.filter(r => r.role === 'interviewer').map(r => r.user_id) || [];

      // Fetch sessions
      const { data: sessions } = await supabase
        .from('interview_sessions')
        .select('id, interviewer_id, status, quality_status, started_at, completed_at');

      // Calculate stats for each interviewer
      const stats: InterviewerData[] = (profiles || [])
        .filter(p => interviewerIds.includes(p.id))
        .map((profile, index) => {
          const userSessions = sessions?.filter(s => s.interviewer_id === profile.id) || [];
          const completed = userSessions.filter(s => s.status === 'completed');
          const approved = userSessions.filter(s => s.quality_status === 'approved');
          const flagged = userSessions.filter(s => s.quality_status === 'flagged');

          // Calculate average duration
          const durations = completed
            .filter(s => s.completed_at)
            .map(s => {
              const start = new Date(s.started_at).getTime();
              const end = new Date(s.completed_at!).getTime();
              return (end - start) / 60000; // minutes
            });
          const avgDuration = durations.length > 0
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
            : 0;

          return {
            id: profile.id,
            name: profile.full_name || profile.email,
            email: profile.email,
            color: COLORS[index % COLORS.length],
            totalSessions: userSessions.length,
            completedSessions: completed.length,
            completionRate: userSessions.length > 0
              ? Math.round((completed.length / userSessions.length) * 100)
              : 0,
            approvalRate: completed.length > 0
              ? Math.round((approved.length / completed.length) * 100)
              : 0,
            avgDuration,
            flaggedCount: flagged.length,
          };
        });

      setInterviewers(stats);
      
      // Select top 3 by default
      const topIds = stats
        .sort((a, b) => b.totalSessions - a.totalSessions)
        .slice(0, 3)
        .map(i => i.id);
      setSelectedIds(topIds);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load comparison data',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const calculateDailyData = useCallback(async () => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date(),
    });

    const { data: sessions } = await supabase
      .from('interview_sessions')
      .select('interviewer_id, started_at, status')
      .in('interviewer_id', selectedIds)
      .gte('started_at', format(days[0], 'yyyy-MM-dd'));

    const daily: DailyData[] = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const displayDate = format(day, 'MMM dd');
      
      const result: DailyData = { date: displayDate };
      
      selectedIds.forEach(id => {
        const interviewer = interviewers.find(i => i.id === id);
        const daySessions = sessions?.filter(s => 
          s.interviewer_id === id && 
          format(new Date(s.started_at), 'yyyy-MM-dd') === dayStr
        ) || [];
        result[interviewer?.name || id] = daySessions.length;
      });
      
      return result;
    });

    setDailyData(daily);
  }, [selectedIds, interviewers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedIds.length > 0) {
      calculateDailyData();
    }
  }, [selectedIds, calculateDailyData]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id].slice(0, 5) // Max 5 selections
    );
  };

  const selectedInterviewers = interviewers.filter(i => selectedIds.includes(i.id));

  // Prepare comparison bar chart data
  const comparisonData = [
    {
      metric: 'Total Sessions',
      ...Object.fromEntries(selectedInterviewers.map(i => [i.name, i.totalSessions])),
    },
    {
      metric: 'Completion Rate',
      ...Object.fromEntries(selectedInterviewers.map(i => [i.name, i.completionRate])),
    },
    {
      metric: 'Approval Rate',
      ...Object.fromEntries(selectedInterviewers.map(i => [i.name, i.approvalRate])),
    },
    {
      metric: 'Avg Duration (min)',
      ...Object.fromEntries(selectedInterviewers.map(i => [i.name, i.avgDuration])),
    },
  ];

  // Prepare radar chart data
  const radarData = selectedInterviewers.map(i => ({
    subject: i.name,
    Sessions: Math.min(i.totalSessions, 100),
    'Completion %': i.completionRate,
    'Approval %': i.approvalRate,
    Efficiency: Math.max(0, 100 - i.avgDuration), // Lower duration = higher efficiency
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Interviewer Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Interviewers to Compare
          </CardTitle>
          <CardDescription>Choose up to 5 interviewers for side-by-side comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {interviewers.map((interviewer) => (
              <div key={interviewer.id} className="flex items-center gap-2">
                <Checkbox
                  id={interviewer.id}
                  checked={selectedIds.includes(interviewer.id)}
                  onCheckedChange={() => toggleSelection(interviewer.id)}
                />
                <Label 
                  htmlFor={interviewer.id} 
                  className="cursor-pointer flex items-center gap-2"
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: interviewer.color }}
                  />
                  <span className="text-sm">{interviewer.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {interviewer.totalSessions} sessions
                  </Badge>
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedIds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Select at least one interviewer to view comparison charts
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Side-by-Side Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Metrics Comparison</CardTitle>
              <CardDescription>Side-by-side comparison of key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="metric" 
                    width={120}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  {selectedInterviewers.map((interviewer) => (
                    <Bar 
                      key={interviewer.id}
                      dataKey={interviewer.name}
                      fill={interviewer.color}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trend Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Trend (Last 14 Days)</CardTitle>
              <CardDescription>Daily session count comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  {selectedInterviewers.map((interviewer) => (
                    <Line 
                      key={interviewer.id}
                      type="monotone"
                      dataKey={interviewer.name}
                      stroke={interviewer.color}
                      strokeWidth={2}
                      dot={{ fill: interviewer.color, r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {selectedInterviewers.map((interviewer) => (
              <Card key={interviewer.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: interviewer.color }}
                    />
                    <CardTitle className="text-sm font-medium truncate">
                      {interviewer.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sessions</span>
                    <span className="font-medium">{interviewer.totalSessions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-medium">{interviewer.completionRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Approval</span>
                    <span className="font-medium">{interviewer.approvalRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Duration</span>
                    <span className="font-medium">{interviewer.avgDuration} min</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
