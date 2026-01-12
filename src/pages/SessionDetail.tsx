import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Globe,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Loader2,
  FileText,
  Activity,
  Users,
  Flag,
  Download,
  MessageSquare,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { exportSessionToPDF } from '@/utils/pdfExport';
import { SessionNotes } from '@/components/session/SessionNotes';
import { QualityReviewPanel } from '@/components/admin/QualityReviewPanel';
import { useAuth } from '@/contexts/AuthContext';

interface SessionData {
  id: string;
  respondent_code: string;
  status: string;
  language: string;
  current_step: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  quality_status: string | null;
  quality_reviewed_by: string | null;
  quality_reviewed_at: string | null;
  quality_notes: string | null;
}

interface EQ5DResponse {
  id: string;
  mobility: number;
  self_care: number;
  usual_activities: number;
  pain_discomfort: number;
  anxiety_depression: number;
  vas_score: number | null;
  created_at: string;
}

interface TTOResponse {
  id: string;
  task_number: number;
  health_state: string;
  final_value: number;
  is_worse_than_death: boolean;
  lead_time_value: number | null;
  flagged: boolean;
  flag_reason: string | null;
  moves_count: number | null;
  time_spent_seconds: number | null;
  created_at: string;
}

interface Demographics {
  id: string;
  age: number | null;
  gender: string | null;
  education: string | null;
  employment: string | null;
  ethnicity: string | null;
  marital_status: string | null;
  created_at: string;
}

const EQ5D_LEVELS: Record<number, string> = {
  1: 'No problems',
  2: 'Slight problems',
  3: 'Moderate problems',
  4: 'Severe problems',
  5: 'Extreme problems / Unable',
};

export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  
  const [session, setSession] = useState<SessionData | null>(null);
  const [eq5dResponse, setEq5dResponse] = useState<EQ5DResponse | null>(null);
  const [ttoResponses, setTtoResponses] = useState<TTOResponse[]>([]);
  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  const fetchSessionData = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      // Fetch session details
      const { data: sessionData, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (sessionError) throw sessionError;
      if (!sessionData) {
        navigate('/sessions');
        return;
      }
      setSession(sessionData);

      // Fetch EQ-5D responses
      const { data: eq5dData } = await supabase
        .from('eq5d_responses')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();
      setEq5dResponse(eq5dData);

      // Fetch TTO responses
      const { data: ttoData } = await supabase
        .from('tto_responses')
        .select('*')
        .eq('session_id', sessionId)
        .order('task_number', { ascending: true });
      setTtoResponses(ttoData || []);

      // Fetch demographics
      const { data: demoData } = await supabase
        .from('demographics')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();
      setDemographics(demoData);

    } catch (error) {
      console.error('Error fetching session data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="default" className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'abandoned':
        return (
          <Badge variant="default" className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="h-3 w-3 mr-1" />
            Abandoned
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLanguageLabel = (code: string) => {
    const languages: Record<string, string> = {
      en: 'English',
      es: 'Español',
      zh: '中文',
      id: 'Bahasa Indonesia',
      ms: 'Bahasa Melayu'
    };
    return languages[code] || code;
  };

  const calculateDuration = (startedAt: string, completedAt: string | null) => {
    if (!completedAt) return 'In progress';
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const diffMs = end.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">Session not found</p>
            <Link to="/sessions">
              <Button>Back to Sessions</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/sessions')} 
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sessions
        </Button>

        {/* Session Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-3xl font-bold text-foreground">
                {session.respondent_code}
              </h1>
              {getStatusBadge(session.status)}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(session.created_at), 'MMM dd, yyyy HH:mm')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {calculateDuration(session.started_at, session.completed_at)}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {getLanguageLabel(session.language)}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            {session.status === 'in_progress' && (
              <Link to={`/interview?resume=${session.id}`}>
                <Button className="gap-2">
                  <Play className="h-4 w-4" />
                  Resume Interview
                </Button>
              </Link>
            )}
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => exportSessionToPDF(session, eq5dResponse, ttoResponses, demographics)}
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <FileText className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="eq5d" className="gap-2">
              <Activity className="h-4 w-4" />
              EQ-5D-5L
            </TabsTrigger>
            <TabsTrigger value="tto" className="gap-2">
              <Clock className="h-4 w-4" />
              TTO Responses
            </TabsTrigger>
            <TabsTrigger value="demographics" className="gap-2">
              <Users className="h-4 w-4" />
              Demographics
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Notes
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="review" className="gap-2">
                <Shield className="h-4 w-4" />
                Quality Review
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">EQ-5D Status</p>
                      <p className="font-semibold text-foreground">
                        {eq5dResponse ? 'Completed' : 'Not completed'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">TTO Tasks</p>
                      <p className="font-semibold text-foreground">
                        {ttoResponses.length} / 10 completed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Flag className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Flagged</p>
                      <p className="font-semibold text-foreground">
                        {ttoResponses.filter(r => r.flagged).length} responses
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-info" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Demographics</p>
                      <p className="font-semibold text-foreground">
                        {demographics ? 'Completed' : 'Not completed'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Current Progress</CardTitle>
                <CardDescription>Interview step: {session.current_step.replace('_', ' ')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['consent', 'warmup', 'practice', 'tto', 'feedback', 'dce', 'demographics', 'complete'].map((step, index) => {
                    const stepOrder = ['consent', 'warmup', 'practice', 'tto', 'feedback', 'dce', 'demographics', 'complete'];
                    const currentIndex = stepOrder.indexOf(session.current_step);
                    const isCompleted = index < currentIndex;
                    const isCurrent = step === session.current_step;
                    
                    return (
                      <Badge 
                        key={step}
                        variant={isCompleted ? 'default' : isCurrent ? 'secondary' : 'outline'}
                        className={isCompleted ? 'bg-success text-success-foreground' : ''}
                      >
                        {isCompleted && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {step.replace('_', ' ')}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EQ-5D Tab */}
          <TabsContent value="eq5d">
            <Card>
              <CardHeader>
                <CardTitle>EQ-5D-5L Responses</CardTitle>
                <CardDescription>Self-reported health state assessment</CardDescription>
              </CardHeader>
              <CardContent>
                {eq5dResponse ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { label: 'Mobility', value: eq5dResponse.mobility },
                        { label: 'Self-Care', value: eq5dResponse.self_care },
                        { label: 'Usual Activities', value: eq5dResponse.usual_activities },
                        { label: 'Pain/Discomfort', value: eq5dResponse.pain_discomfort },
                        { label: 'Anxiety/Depression', value: eq5dResponse.anxiety_depression },
                      ].map((dim) => (
                        <div key={dim.label} className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">{dim.label}</p>
                          <p className="font-semibold text-foreground">
                            Level {dim.value}: {EQ5D_LEVELS[dim.value]}
                          </p>
                        </div>
                      ))}
                    </div>
                    {eq5dResponse.vas_score !== null && (
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">VAS Score (0-100)</p>
                        <p className="text-2xl font-bold text-primary">{eq5dResponse.vas_score}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No EQ-5D responses recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TTO Tab */}
          <TabsContent value="tto">
            <Card>
              <CardHeader>
                <CardTitle>TTO Responses</CardTitle>
                <CardDescription>Time Trade-Off valuation results</CardDescription>
              </CardHeader>
              <CardContent>
                {ttoResponses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Task</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Health State</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Value</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">WTD</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Moves</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Time</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ttoResponses.map((response) => (
                          <tr key={response.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium">{response.task_number}</td>
                            <td className="py-3 px-4 font-mono text-sm">{response.health_state}</td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-primary">
                                {Number(response.final_value).toFixed(3)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {response.is_worse_than_death ? (
                                <Badge variant="destructive" className="text-xs">Yes</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">No</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {response.moves_count || '-'}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {response.time_spent_seconds ? `${response.time_spent_seconds}s` : '-'}
                            </td>
                            <td className="py-3 px-4">
                              {response.flagged ? (
                                <Badge variant="default" className="bg-warning/10 text-warning border-warning/20 text-xs">
                                  <Flag className="h-3 w-3 mr-1" />
                                  {response.flag_reason || 'Flagged'}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">OK</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No TTO responses recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Demographics Tab */}
          <TabsContent value="demographics">
            <Card>
              <CardHeader>
                <CardTitle>Demographics</CardTitle>
                <CardDescription>Respondent background information</CardDescription>
              </CardHeader>
              <CardContent>
                {demographics ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: 'Age', value: demographics.age },
                      { label: 'Gender', value: demographics.gender },
                      { label: 'Education', value: demographics.education },
                      { label: 'Employment', value: demographics.employment },
                      { label: 'Ethnicity', value: demographics.ethnicity },
                      { label: 'Marital Status', value: demographics.marital_status },
                    ].map((field) => (
                      <div key={field.label} className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">{field.label}</p>
                        <p className="font-semibold text-foreground capitalize">
                          {field.value || 'Not provided'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No demographics recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <SessionNotes sessionId={session.id} />
          </TabsContent>

          {/* Quality Review Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="review">
              <QualityReviewPanel
                sessionId={session.id}
                currentStatus={session.quality_status || 'pending'}
                reviewedBy={session.quality_reviewed_by}
                reviewedAt={session.quality_reviewed_at}
                qualityNotes={session.quality_notes}
                onStatusChange={fetchSessionData}
              />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
