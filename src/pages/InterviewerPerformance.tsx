import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  Users,
  BarChart3,
  FileSpreadsheet,
  Loader2,
  ArrowUpDown,
  Eye,
  Target,
  Mail,
  GitCompare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, differenceInMinutes } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { PerformanceGoals } from '@/components/admin/PerformanceGoals';
import { PerformanceComparison } from '@/components/admin/PerformanceComparison';
import { EmailReportScheduler } from '@/components/admin/EmailReportScheduler';

interface InterviewerStats {
  id: string;
  email: string;
  fullName: string;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  avgDuration: number;
  approvalRate: number;
  flaggedCount: number;
  lastActive: string | null;
  sessionsThisWeek: number;
  avgTTOValue: number | null;
}

interface DetailedPerformance {
  dailyStats: { date: string; sessions: number; completed: number }[];
  qualityBreakdown: { status: string; count: number }[];
  ttoDistribution: { range: string; count: number }[];
  recentSessions: {
    id: string;
    respondentCode: string;
    status: string;
    qualityStatus: string;
    startedAt: string;
    completedAt: string | null;
    duration: number | null;
  }[];
}

export default function InterviewerPerformance() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [interviewers, setInterviewers] = useState<InterviewerStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof InterviewerStats>('totalSessions');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedInterviewer, setSelectedInterviewer] = useState<InterviewerStats | null>(null);
  const [detailedPerformance, setDetailedPerformance] = useState<DetailedPerformance | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchInterviewerStats();
  }, []);

  const fetchInterviewerStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all interviewers (profiles with interviewer role)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name');

      if (profilesError) throw profilesError;

      // Fetch user roles to filter interviewers
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const interviewerIds = roles
        ?.filter(r => r.role === 'interviewer')
        .map(r => r.user_id) || [];

      // Fetch all sessions with their data
      const { data: sessions, error: sessionsError } = await supabase
        .from('interview_sessions')
        .select('id, interviewer_id, status, quality_status, started_at, completed_at');

      if (sessionsError) throw sessionsError;

      // Fetch TTO responses for average calculation
      const { data: ttoResponses, error: ttoError } = await supabase
        .from('tto_responses')
        .select('session_id, final_value');

      if (ttoError) throw ttoError;

      const oneWeekAgo = subDays(new Date(), 7);

      // Calculate stats for each interviewer
      const stats: InterviewerStats[] = profiles
        ?.filter(p => interviewerIds.includes(p.id))
        .map(profile => {
          const interviewerSessions = sessions?.filter(s => s.interviewer_id === profile.id) || [];
          const completedSessions = interviewerSessions.filter(s => s.status === 'completed');
          const approvedSessions = interviewerSessions.filter(s => s.quality_status === 'approved');
          const flaggedSessions = interviewerSessions.filter(s => s.quality_status === 'flagged');
          const sessionsThisWeek = interviewerSessions.filter(s => 
            new Date(s.started_at) >= oneWeekAgo
          );

          // Calculate average duration
          const durations = completedSessions
            .filter(s => s.completed_at)
            .map(s => differenceInMinutes(new Date(s.completed_at!), new Date(s.started_at)));
          const avgDuration = durations.length > 0 
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) 
            : 0;

          // Calculate average TTO value
          const sessionIds = interviewerSessions.map(s => s.id);
          const relevantTTO = ttoResponses?.filter(t => sessionIds.includes(t.session_id)) || [];
          const avgTTO = relevantTTO.length > 0
            ? relevantTTO.reduce((a, b) => a + Number(b.final_value), 0) / relevantTTO.length
            : null;

          // Get last active
          const lastSession = interviewerSessions
            .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];

          return {
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name || profile.email,
            totalSessions: interviewerSessions.length,
            completedSessions: completedSessions.length,
            completionRate: interviewerSessions.length > 0 
              ? Math.round((completedSessions.length / interviewerSessions.length) * 100) 
              : 0,
            avgDuration,
            approvalRate: completedSessions.length > 0
              ? Math.round((approvedSessions.length / completedSessions.length) * 100)
              : 0,
            flaggedCount: flaggedSessions.length,
            lastActive: lastSession?.started_at || null,
            sessionsThisWeek: sessionsThisWeek.length,
            avgTTOValue: avgTTO ? Math.round(avgTTO * 100) / 100 : null,
          };
        }) || [];

      setInterviewers(stats);
    } catch (error) {
      console.error('Error fetching interviewer stats:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load interviewer performance data',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedPerformance = async (interviewer: InterviewerStats) => {
    try {
      setLoadingDetails(true);
      setSelectedInterviewer(interviewer);

      // Fetch sessions for this interviewer
      const { data: sessions, error: sessionsError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('interviewer_id', interviewer.id)
        .order('started_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Fetch TTO responses
      const sessionIds = sessions?.map(s => s.id) || [];
      const { data: ttoResponses, error: ttoError } = await supabase
        .from('tto_responses')
        .select('session_id, final_value')
        .in('session_id', sessionIds);

      if (ttoError) throw ttoError;

      // Calculate daily stats for last 14 days
      const days = Array.from({ length: 14 }, (_, i) => subDays(new Date(), 13 - i));
      const dailyStats = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const daySessions = sessions?.filter(s => 
          format(new Date(s.started_at), 'yyyy-MM-dd') === dayStr
        ) || [];
        return {
          date: format(day, 'MMM dd'),
          sessions: daySessions.length,
          completed: daySessions.filter(s => s.status === 'completed').length,
        };
      });

      // Quality breakdown
      const qualityBreakdown = [
        { status: 'Pending', count: sessions?.filter(s => !s.quality_status || s.quality_status === 'pending').length || 0 },
        { status: 'Approved', count: sessions?.filter(s => s.quality_status === 'approved').length || 0 },
        { status: 'Flagged', count: sessions?.filter(s => s.quality_status === 'flagged').length || 0 },
        { status: 'Rejected', count: sessions?.filter(s => s.quality_status === 'rejected').length || 0 },
      ].filter(q => q.count > 0);

      // TTO distribution
      const ranges = [
        { min: -1, max: 0, label: 'WTD (<0)' },
        { min: 0, max: 0.25, label: '0-0.25' },
        { min: 0.25, max: 0.5, label: '0.25-0.5' },
        { min: 0.5, max: 0.75, label: '0.5-0.75' },
        { min: 0.75, max: 1.001, label: '0.75-1.0' },
      ];

      const ttoDistribution = ranges.map(range => ({
        range: range.label,
        count: ttoResponses?.filter(r => 
          Number(r.final_value) >= range.min && Number(r.final_value) < range.max
        ).length || 0
      }));

      // Recent sessions
      const recentSessions = (sessions?.slice(0, 10) || []).map(s => ({
        id: s.id,
        respondentCode: s.respondent_code,
        status: s.status,
        qualityStatus: s.quality_status || 'pending',
        startedAt: s.started_at,
        completedAt: s.completed_at,
        duration: s.completed_at 
          ? differenceInMinutes(new Date(s.completed_at), new Date(s.started_at))
          : null,
      }));

      setDetailedPerformance({
        dailyStats,
        qualityBreakdown,
        ttoDistribution,
        recentSessions,
      });
    } catch (error) {
      console.error('Error fetching detailed performance:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load detailed performance data',
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      const headers = [
        'Name',
        'Email',
        'Total Sessions',
        'Completed Sessions',
        'Completion Rate (%)',
        'Avg Duration (min)',
        'Approval Rate (%)',
        'Flagged Count',
        'Sessions This Week',
        'Avg TTO Value',
        'Last Active',
      ];

      const rows = interviewers.map(i => [
        i.fullName,
        i.email,
        i.totalSessions,
        i.completedSessions,
        i.completionRate,
        i.avgDuration,
        i.approvalRate,
        i.flaggedCount,
        i.sessionsThisWeek,
        i.avgTTOValue ?? '',
        i.lastActive ? format(new Date(i.lastActive), 'yyyy-MM-dd HH:mm') : '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => 
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interviewer-performance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: 'Performance report downloaded as CSV',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: 'Could not export performance data',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredInterviewers = interviewers
    .filter(i => 
      i.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : 1;
      }
      return aVal > bVal ? -1 : 1;
    });

  const toggleSort = (column: keyof InterviewerStats) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Calculate summary stats
  const totalSessions = interviewers.reduce((sum, i) => sum + i.totalSessions, 0);
  const avgCompletionRate = interviewers.length > 0
    ? Math.round(interviewers.reduce((sum, i) => sum + i.completionRate, 0) / interviewers.length)
    : 0;
  const avgApprovalRate = interviewers.length > 0
    ? Math.round(interviewers.reduce((sum, i) => sum + i.approvalRate, 0) / interviewers.length)
    : 0;
  const activeThisWeek = interviewers.filter(i => i.sessionsThisWeek > 0).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-success/10 text-success border-success/20">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-warning/10 text-warning border-warning/20">In Progress</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getQualityBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-success/10 text-success border-success/20">Approved</Badge>;
      case 'flagged':
        return <Badge variant="default" className="bg-warning/10 text-warning border-warning/20">Flagged</Badge>;
      case 'rejected':
        return <Badge variant="default" className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Interviewer Performance
            </h1>
            <p className="text-muted-foreground">
              Detailed statistics and performance metrics for all interviewers
            </p>
          </div>
          <Button 
            onClick={handleExport} 
            className="gap-2"
            disabled={isExporting || interviewers.length === 0}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Export Report
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            <TabsTrigger value="comparison" className="gap-2">
              <GitCompare className="h-4 w-4" />
              <span className="hidden sm:inline">Compare</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{interviewers.length}</p>
                  <p className="text-sm text-muted-foreground">Total Interviewers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalSessions}</p>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{avgCompletionRate}%</p>
                  <p className="text-sm text-muted-foreground">Avg Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{activeThisWeek}</p>
                  <p className="text-sm text-muted-foreground">Active This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as keyof InterviewerStats)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totalSessions">Total Sessions</SelectItem>
                  <SelectItem value="completionRate">Completion Rate</SelectItem>
                  <SelectItem value="approvalRate">Approval Rate</SelectItem>
                  <SelectItem value="avgDuration">Avg Duration</SelectItem>
                  <SelectItem value="sessionsThisWeek">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Performance Details</CardTitle>
            <CardDescription>Click on an interviewer to view detailed statistics</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredInterviewers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No interviewers found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Interviewer</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground"
                        onClick={() => toggleSort('totalSessions')}
                      >
                        <div className="flex items-center gap-1">
                          Sessions
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground"
                        onClick={() => toggleSort('completionRate')}
                      >
                        <div className="flex items-center gap-1">
                          Completion
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-foreground"
                        onClick={() => toggleSort('approvalRate')}
                      >
                        <div className="flex items-center gap-1">
                          Approval
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>Avg Duration</TableHead>
                      <TableHead>Flagged</TableHead>
                      <TableHead>This Week</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInterviewers.map((interviewer) => (
                      <TableRow 
                        key={interviewer.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => fetchDetailedPerformance(interviewer)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {interviewer.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{interviewer.fullName}</p>
                              <p className="text-xs text-muted-foreground">{interviewer.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{interviewer.totalSessions}</span>
                          <span className="text-muted-foreground text-sm"> ({interviewer.completedSessions} done)</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={interviewer.completionRate} className="w-16 h-2" />
                            <span className="text-sm">{interviewer.completionRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={interviewer.approvalRate} className="w-16 h-2" />
                            <span className="text-sm">{interviewer.approvalRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{interviewer.avgDuration} min</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {interviewer.flaggedCount > 0 ? (
                            <Badge variant="default" className="bg-warning/10 text-warning border-warning/20">
                              {interviewer.flaggedCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {interviewer.sessionsThisWeek > 0 ? (
                              <>
                                <TrendingUp className="h-4 w-4 text-success" />
                                <span className="text-success font-medium">{interviewer.sessionsThisWeek}</span>
                              </>
                            ) : (
                              <>
                                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">0</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {interviewer.lastActive 
                            ? format(new Date(interviewer.lastActive), 'MMM dd, HH:mm')
                            : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Eye className="h-4 w-4" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Performance Dialog */}
        <Dialog open={selectedInterviewer !== null} onOpenChange={() => setSelectedInterviewer(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {selectedInterviewer?.fullName} - Performance Details
              </DialogTitle>
              <DialogDescription>
                {selectedInterviewer?.email}
              </DialogDescription>
            </DialogHeader>

            {loadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : detailedPerformance ? (
              <div className="space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{selectedInterviewer?.totalSessions}</p>
                    <p className="text-sm text-muted-foreground">Total Sessions</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{selectedInterviewer?.completionRate}%</p>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{selectedInterviewer?.approvalRate}%</p>
                    <p className="text-sm text-muted-foreground">Approval Rate</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{selectedInterviewer?.avgDuration} min</p>
                    <p className="text-sm text-muted-foreground">Avg Duration</p>
                  </div>
                </div>

                {/* Activity Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Activity (Last 14 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={detailedPerformance.dailyStats}>
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
                        <Bar dataKey="sessions" fill="hsl(var(--primary))" name="Total" />
                        <Bar dataKey="completed" fill="hsl(var(--success))" name="Completed" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* TTO Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">TTO Value Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={detailedPerformance.ttoDistribution}>
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
                        <Bar dataKey="count" fill="hsl(var(--info))" name="Responses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Recent Sessions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Respondent</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Quality</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detailedPerformance.recentSessions.map((session) => (
                            <TableRow key={session.id}>
                              <TableCell className="font-medium">{session.respondentCode}</TableCell>
                              <TableCell>{getStatusBadge(session.status)}</TableCell>
                              <TableCell>{getQualityBadge(session.qualityStatus)}</TableCell>
                              <TableCell>
                                {session.duration ? `${session.duration} min` : '-'}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(session.startedAt), 'MMM dd, HH:mm')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
          </TabsContent>

          <TabsContent value="goals">
            <PerformanceGoals />
          </TabsContent>

          <TabsContent value="comparison">
            <PerformanceComparison />
          </TabsContent>

          <TabsContent value="reports">
            <EmailReportScheduler />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
