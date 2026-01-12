import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Play, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Calendar,
  Users,
  ClipboardList,
  ChevronRight,
  Lightbulb,
  Loader2,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday } from 'date-fns';
import { CreateSessionDialog } from '@/components/session/CreateSessionDialog';

interface SessionStats {
  totalSessions: number;
  completedToday: number;
  avgDuration: string;
  completionRate: number;
}

interface RecentSession {
  id: string;
  respondent_code: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

const TIPS = [
  "Ensure respondents understand the wheelchair practice task before proceeding",
  "Take breaks if needed - quality responses are more important than speed",
  "Use the AI assistant for protocol guidance during complex scenarios",
  "Flag any responses that seem inconsistent for later review",
];

export default function InterviewerDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    completedToday: 0,
    avgDuration: '0 min',
    completionRate: 0,
  });
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const displayName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Interviewer';

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interview_sessions',
          filter: `interviewer_id=eq.${user.id}`
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      // Fetch all sessions for this interviewer
      const { data: sessions, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('interviewer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (sessions) {
        // Calculate stats
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(s => s.status === 'completed');
        const completedToday = completedSessions.filter(s => 
          s.completed_at && isToday(new Date(s.completed_at))
        ).length;

        // Calculate average duration for completed sessions
        let avgDurationMin = 0;
        if (completedSessions.length > 0) {
          const durations = completedSessions
            .filter(s => s.completed_at)
            .map(s => {
              const start = new Date(s.started_at);
              const end = new Date(s.completed_at!);
              return (end.getTime() - start.getTime()) / 60000; // minutes
            });
          avgDurationMin = durations.reduce((a, b) => a + b, 0) / durations.length;
        }

        const completionRate = totalSessions > 0 
          ? Math.round((completedSessions.length / totalSessions) * 100) 
          : 0;

        setStats({
          totalSessions,
          completedToday,
          avgDuration: `${Math.round(avgDurationMin)} min`,
          completionRate,
        });

        // Set recent sessions (top 4)
        setRecentSessions(sessions.slice(0, 4));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (startedAt: string, completedAt: string | null) => {
    if (!completedAt) return '-';
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const diffMs = end.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-4 sm:py-8 px-3 sm:px-4">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Welcome back, {displayName}!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Ready to conduct TTO interviews? Here's your dashboard overview.
          </p>
        </div>

        {/* Quick Action */}
        <Card className="mb-6 sm:mb-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-glow">
          <CardContent className="py-6 sm:py-8">
            <div className="flex flex-col items-center text-center gap-4 sm:gap-6">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Start New Interview</h2>
                <p className="text-primary-foreground/80 max-w-md text-sm sm:text-base">
                  Begin a new EQ-5D-5L TTO interview session with a respondent.
                </p>
              </div>
              <Button 
                variant="hero-outline" 
                size="lg" 
                className="gap-2 w-full sm:w-auto"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-5 w-5" />
                Start Interview
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Card className="card-hover">
              <CardContent className="p-4 sm:pt-6 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalSessions}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-4 sm:pt-6 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.completedToday}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Completed Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-4 sm:pt-6 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.avgDuration}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Avg Duration</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-4 sm:pt-6 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-info/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-info" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.completionRate}%</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Completion Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Sessions */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display text-lg sm:text-xl">Recent Sessions</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Your latest interview sessions</CardDescription>
                </div>
                <Link to="/sessions">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs sm:text-sm">
                    View all <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : recentSessions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4 text-sm">No sessions yet</p>
                  <Button size="sm" onClick={() => setShowCreateDialog(true)}>Start Your First Interview</Button>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors gap-2 sm:gap-0"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm sm:text-base">{session.respondent_code}</p>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(session.created_at), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 ml-11 sm:ml-0">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {calculateDuration(session.started_at, session.completed_at)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          session.status === 'completed' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {session.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-warning" />
                Interview Tips
              </CardTitle>
              <CardDescription>Best practices for TTO interviews</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {TIPS.map((tip, index) => (
                  <li key={index} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <CreateSessionDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </div>
  );
}
