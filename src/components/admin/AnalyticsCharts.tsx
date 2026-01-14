import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface SessionData {
  id: string;
  status: string;
  quality_status: string | null;
  started_at: string;
  completed_at: string | null;
}

interface TTOData {
  session_id: string;
  final_value: number;
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
  date: string;
  passed: number;
  flagged: number;
}

export function AnalyticsCharts() {
  const [loading, setLoading] = useState(true);
  const [completionData, setCompletionData] = useState<CompletionDataPoint[]>([]);
  const [ttoData, setTTOData] = useState<TTODataPoint[]>([]);
  const [qualityData, setQualityData] = useState<QualityDataPoint[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch sessions from last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const { data: sessions } = await supabase
        .from('interview_sessions')
        .select('id, status, quality_status, started_at, completed_at')
        .gte('started_at', thirtyDaysAgo.toISOString());

      const { data: ttoResponses } = await supabase
        .from('tto_responses')
        .select('session_id, final_value, created_at');

      if (sessions) {
        // Process completion rates by day
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
            total,
            rate: total > 0 ? Math.round((completed / total) * 100) : 0
          };
        });

        setCompletionData(completionByDay.slice(-14)); // Last 14 days

        // Process quality status distribution
        const qualityCounts = {
          pending: sessions.filter(s => !s.quality_status || s.quality_status === 'pending').length,
          approved: sessions.filter(s => s.quality_status === 'approved').length,
          flagged: sessions.filter(s => s.quality_status === 'flagged').length,
          rejected: sessions.filter(s => s.quality_status === 'rejected').length,
        };

        setQualityData([
          { name: 'Pending', value: qualityCounts.pending, color: 'hsl(var(--muted-foreground))' },
          { name: 'Approved', value: qualityCounts.approved, color: 'hsl(var(--success))' },
          { name: 'Flagged', value: qualityCounts.flagged, color: 'hsl(var(--warning))' },
          { name: 'Rejected', value: qualityCounts.rejected, color: 'hsl(var(--destructive))' },
        ].filter(d => d.value > 0));
      }

      if (ttoResponses) {
        // Group TTO values by ranges
        const ranges = [
          { min: -1, max: 0, label: 'WTD (<0)' },
          { min: 0, max: 0.25, label: '0-0.25' },
          { min: 0.25, max: 0.5, label: '0.25-0.5' },
          { min: 0.5, max: 0.75, label: '0.5-0.75' },
          { min: 0.75, max: 1, label: '0.75-1.0' },
        ];

        const ttoDistribution = ranges.map(range => ({
          range: range.label,
          count: ttoResponses.filter(r => 
            r.final_value >= range.min && r.final_value < range.max + 0.001
          ).length
        }));

        setTTOData(ttoDistribution);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
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
    <div className="grid md:grid-cols-2 gap-6">
      {/* Completion Rate Over Time */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="font-display">Session Completion Rate</CardTitle>
          <CardDescription>Daily completion rates over the last 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                name="Completed"
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Total"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* TTO Value Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">TTO Value Distribution</CardTitle>
          <CardDescription>Distribution of final TTO values</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ttoData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="range" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quality Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Quality Review Status</CardTitle>
          <CardDescription>Distribution of session quality statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={qualityData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
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
    </div>
  );
}
