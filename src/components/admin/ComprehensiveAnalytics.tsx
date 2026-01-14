import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval, startOfWeek, eachWeekOfInterval } from 'date-fns';
import { Loader2, TrendingUp, TrendingDown, Users, Clock, Target, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SessionData {
  id: string;
  status: string;
  quality_status: string | null;
  started_at: string;
  completed_at: string | null;
  interviewer_id: string;
}

interface InterviewerStats {
  id: string;
  name: string;
  sessions: number;
  completed: number;
  avgTime: number;
  approvalRate: number;
}

interface CompletionDataPoint {
  date: string;
  completed: number;
  total: number;
}

interface TTODataPoint {
  date: string;
  value: number;
}

interface QualityDataPoint {
  name: string;
  value: number;
  color: string;
}

interface WeeklyTrendPoint {
  week: string;
  sessions: number;
  completed: number;
  avgValue: number;
}

interface TTOByHealthStatePoint {
  healthState: string;
  fullState: string;
  avgValue: number;
  count: number;
}

interface TimeDistributionPoint {
  range: string;
  count: number;
}

interface InterviewerPerformance {
  sessions: number;
  completed: number;
  approved: number;
  totalTime: number;
  timeCount: number;
}

export function ComprehensiveAnalytics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completionData, setCompletionData] = useState<CompletionDataPoint[]>([]);
  const [ttoData, setTTOData] = useState<TTODataPoint[]>([]);
  const [qualityData, setQualityData] = useState<QualityDataPoint[]>([]);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrendPoint[]>([]);
  const [interviewerStats, setInterviewerStats] = useState<InterviewerStats[]>([]);
  const [ttoByHealthState, setTtoByHealthState] = useState<TTOByHealthStatePoint[]>([]);
  const [timeDistribution, setTimeDistribution] = useState<TimeDistributionPoint[]>([]);
  const [summary, setSummary] = useState({
    totalSessions: 0,
    completedSessions: 0,
    avgCompletionRate: 0,
    avgSessionTime: 0,
    totalTTOResponses: 0,
    avgTTOValue: 0,
    wtdPercentage: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const thirtyDaysAgo = subDays(new Date(), 30);
      const ninetyDaysAgo = subDays(new Date(), 90);
      
      // Fetch all data in parallel
      const [sessionsResult, ttoResult, profilesResult] = await Promise.all([
        supabase
          .from('interview_sessions')
          .select('id, status, quality_status, started_at, completed_at, interviewer_id')
          .gte('started_at', ninetyDaysAgo.toISOString()),
        supabase
          .from('tto_responses')
          .select('session_id, final_value, health_state, time_spent_seconds, is_worse_than_death, created_at'),
        supabase
          .from('profiles')
          .select('id, full_name, email')
      ]);

      const sessions = sessionsResult.data || [];
      const ttoResponses = ttoResult.data || [];
      const profiles = profilesResult.data || [];

      // Calculate summary stats
      const completedSessions = sessions.filter(s => s.status === 'completed');
      const avgCompletionRate = sessions.length > 0 
        ? Math.round((completedSessions.length / sessions.length) * 100) 
        : 0;
      
      const sessionsWithTime = completedSessions.filter(s => s.completed_at && s.started_at);
      const avgSessionTime = sessionsWithTime.length > 0
        ? Math.round(sessionsWithTime.reduce((acc, s) => {
            const start = new Date(s.started_at).getTime();
            const end = new Date(s.completed_at!).getTime();
            return acc + (end - start) / 1000 / 60;
          }, 0) / sessionsWithTime.length)
        : 0;

      const avgTTOValue = ttoResponses.length > 0
        ? ttoResponses.reduce((acc, r) => acc + r.final_value, 0) / ttoResponses.length
        : 0;

      const wtdCount = ttoResponses.filter(r => r.final_value < 0 || r.is_worse_than_death).length;
      const wtdPercentage = ttoResponses.length > 0
        ? Math.round((wtdCount / ttoResponses.length) * 100)
        : 0;

      setSummary({
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        avgCompletionRate,
        avgSessionTime,
        totalTTOResponses: ttoResponses.length,
        avgTTOValue: Math.round(avgTTOValue * 100) / 100,
        wtdPercentage,
      });

      // Daily completion data (last 14 days)
      const days = eachDayOfInterval({
        start: thirtyDaysAgo,
        end: new Date()
      });

      const completionByDay = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const daySessions = sessions.filter(s => 
          format(new Date(s.started_at), 'yyyy-MM-dd') === dayStr
        );
        const completed = daySessions.filter(s => s.status === 'completed').length;
        const total = daySessions.length;
        
        return {
          date: format(day, 'MMM dd'),
          completed,
          inProgress: daySessions.filter(s => s.status === 'in_progress').length,
          abandoned: daySessions.filter(s => s.status === 'abandoned').length,
          total,
          rate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
      });

      setCompletionData(completionByDay.slice(-14));

      // Weekly trends (last 12 weeks)
      const weeks = eachWeekOfInterval({
        start: ninetyDaysAgo,
        end: new Date()
      });

      const weeklyData = weeks.map(weekStart => {
        const weekEnd = subDays(startOfWeek(subDays(weekStart, -7)), 1);
        const weekSessions = sessions.filter(s => {
          const date = new Date(s.started_at);
          return date >= weekStart && date < weekEnd;
        });
        const completed = weekSessions.filter(s => s.status === 'completed').length;
        
        return {
          week: format(weekStart, 'MMM dd'),
          sessions: weekSessions.length,
          completed,
          rate: weekSessions.length > 0 ? Math.round((completed / weekSessions.length) * 100) : 0
        };
      });

      setWeeklyTrends(weeklyData.slice(-8));

      // Quality status distribution
      const qualityCounts = {
        pending: sessions.filter(s => !s.quality_status || s.quality_status === 'pending').length,
        approved: sessions.filter(s => s.quality_status === 'approved').length,
        flagged: sessions.filter(s => s.quality_status === 'flagged').length,
        rejected: sessions.filter(s => s.quality_status === 'rejected').length,
      };

      setQualityData([
        { name: 'Pending', value: qualityCounts.pending, color: '#94a3b8' },
        { name: 'Approved', value: qualityCounts.approved, color: '#22c55e' },
        { name: 'Flagged', value: qualityCounts.flagged, color: '#f59e0b' },
        { name: 'Rejected', value: qualityCounts.rejected, color: '#ef4444' },
      ].filter(d => d.value > 0));

      // TTO value distribution
      const ranges = [
        { min: -1, max: 0, label: 'WTD (<0)', color: '#ef4444' },
        { min: 0, max: 0.25, label: '0-0.25', color: '#f97316' },
        { min: 0.25, max: 0.5, label: '0.25-0.5', color: '#eab308' },
        { min: 0.5, max: 0.75, label: '0.5-0.75', color: '#84cc16' },
        { min: 0.75, max: 1.001, label: '0.75-1.0', color: '#22c55e' },
      ];

      const ttoDistribution = ranges.map(range => ({
        range: range.label,
        count: ttoResponses.filter(r => 
          r.final_value >= range.min && r.final_value < range.max
        ).length,
        color: range.color
      }));

      setTTOData(ttoDistribution);

      // TTO by health state (top 10 most common)
      const healthStateMap = new Map<string, { total: number, count: number }>();
      ttoResponses.forEach(r => {
        const current = healthStateMap.get(r.health_state) || { total: 0, count: 0 };
        healthStateMap.set(r.health_state, {
          total: current.total + r.final_value,
          count: current.count + 1
        });
      });

      const healthStateData = Array.from(healthStateMap.entries())
        .map(([state, data]) => ({
          state: state.length > 8 ? state.substring(0, 8) + '...' : state,
          fullState: state,
          avgValue: Math.round((data.total / data.count) * 100) / 100,
          count: data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setTtoByHealthState(healthStateData);

      // Session time distribution
      const timeRanges = [
        { min: 0, max: 10, label: '<10 min' },
        { min: 10, max: 15, label: '10-15 min' },
        { min: 15, max: 20, label: '15-20 min' },
        { min: 20, max: 30, label: '20-30 min' },
        { min: 30, max: 999, label: '>30 min' },
      ];

      const timeDist = timeRanges.map(range => {
        const count = sessionsWithTime.filter(s => {
          const start = new Date(s.started_at).getTime();
          const end = new Date(s.completed_at!).getTime();
          const minutes = (end - start) / 1000 / 60;
          return minutes >= range.min && minutes < range.max;
        }).length;
        return { range: range.label, count };
      });

      setTimeDistribution(timeDist);

      // Interviewer performance stats
      const interviewerMap = new Map<string, InterviewerPerformance>();
      
      sessions.forEach(s => {
        const current = interviewerMap.get(s.interviewer_id) || { 
          sessions: 0, 
          completed: 0, 
          approved: 0, 
          totalTime: 0,
          timeCount: 0
        };
        
        current.sessions++;
        if (s.status === 'completed') {
          current.completed++;
          if (s.completed_at && s.started_at) {
            const start = new Date(s.started_at).getTime();
            const end = new Date(s.completed_at).getTime();
            current.totalTime += (end - start) / 1000 / 60;
            current.timeCount++;
          }
        }
        if (s.quality_status === 'approved') current.approved++;
        
        interviewerMap.set(s.interviewer_id, current);
      });

      const stats: InterviewerStats[] = Array.from(interviewerMap.entries())
        .map(([id, data]) => {
          const profile = profiles.find(p => p.id === id);
          return {
            id,
            name: profile?.full_name || profile?.email || 'Unknown',
            sessions: data.sessions,
            completed: data.completed,
            avgTime: data.timeCount > 0 ? Math.round(data.totalTime / data.timeCount) : 0,
            approvalRate: data.completed > 0 ? Math.round((data.approved / data.completed) * 100) : 0
          };
        })
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 10);

      setInterviewerStats(stats);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground text-sm">Comprehensive insights into interview performance</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-foreground">{summary.totalSessions}</p>
            <p className="text-xs text-muted-foreground">Total Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-emerald-600">{summary.completedSessions}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-primary">{summary.avgCompletionRate}%</p>
            <p className="text-xs text-muted-foreground">Completion Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-foreground">{summary.avgSessionTime}m</p>
            <p className="text-xs text-muted-foreground">Avg Duration</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-foreground">{summary.totalTTOResponses}</p>
            <p className="text-xs text-muted-foreground">TTO Responses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-primary">{summary.avgTTOValue}</p>
            <p className="text-xs text-muted-foreground">Avg TTO Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-amber-600">{summary.wtdPercentage}%</p>
            <p className="text-xs text-muted-foreground">WTD Rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="completion" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="completion" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            Completion
          </TabsTrigger>
          <TabsTrigger value="tto" className="gap-1">
            <Target className="h-3 w-3" />
            TTO Values
          </TabsTrigger>
          <TabsTrigger value="quality" className="gap-1">Quality</TabsTrigger>
          <TabsTrigger value="interviewers" className="gap-1">
            <Users className="h-3 w-3" />
            Interviewers
          </TabsTrigger>
          <TabsTrigger value="timing" className="gap-1">
            <Clock className="h-3 w-3" />
            Timing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completion" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Daily Completion Chart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="font-display">Daily Session Activity</CardTitle>
                <CardDescription>Sessions started and completed over the last 14 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={completionData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="completed" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="Completed" />
                    <Area type="monotone" dataKey="inProgress" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="In Progress" />
                    <Area type="monotone" dataKey="abandoned" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Abandoned" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weekly Trends */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="font-display">Weekly Trends</CardTitle>
                <CardDescription>Completion rate trends over the last 8 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total Sessions" />
                    <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2} name="Completion Rate %" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tto" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* TTO Value Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display">TTO Value Distribution</CardTitle>
                <CardDescription>Distribution of final TTO values across all sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ttoData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="range" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {ttoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* TTO by Health State */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Average TTO by Health State</CardTitle>
                <CardDescription>Top 10 most frequently valued health states</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ttoByHealthState} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[-0.5, 1]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis type="category" dataKey="state" width={70} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, _name: string, props: { payload?: { count?: number } }) => [
                        `${value} (n=${props.payload?.count ?? 0})`,
                        'Avg Value'
                      ]}
                      labelFormatter={(label: string, payload?: Array<{ payload?: { fullState?: string } }>) => 
                        payload?.[0]?.payload?.fullState || label
                      }
                    />
                    <Bar dataKey="avgValue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Quality Status Pie */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Quality Review Status</CardTitle>
                <CardDescription>Distribution of session quality statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={qualityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {qualityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quality Stats Cards */}
            <div className="space-y-4">
              {qualityData.map((item) => (
                <Card key={item.name}>
                  <CardContent className="pt-4 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-4 w-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{item.value}</p>
                      <p className="text-xs text-muted-foreground">
                        {summary.totalSessions > 0 
                          ? `${Math.round((item.value / summary.totalSessions) * 100)}%` 
                          : '0%'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="interviewers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Interviewer Performance Comparison</CardTitle>
              <CardDescription>Top 10 interviewers by session count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={interviewerStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="completed" fill="#22c55e" name="Completed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" name="Total Sessions" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interviewerStats.slice(0, 6).map((stat) => (
              <Card key={stat.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {stat.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{stat.name}</p>
                      <p className="text-xs text-muted-foreground">{stat.sessions} sessions</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-emerald-600">{stat.completed}</p>
                      <p className="text-[10px] text-muted-foreground">Completed</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-primary">{stat.avgTime}m</p>
                      <p className="text-[10px] text-muted-foreground">Avg Time</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-600">{stat.approvalRate}%</p>
                      <p className="text-[10px] text-muted-foreground">Approved</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Session Duration Distribution</CardTitle>
              <CardDescription>How long completed sessions typically take</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="range" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
