import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  Play,
  Plus,
  Download,
  FileDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { CreateSessionDialog } from '@/components/session/CreateSessionDialog';
import { exportBatchToPDF } from '@/utils/batchPdfExport';
import { useToast } from '@/hooks/use-toast';

interface InterviewSession {
  id: string;
  respondent_code: string;
  status: string;
  language: string;
  current_step: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

export default function SessionHistory() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user, currentPage, statusFilter, languageFilter]);

  const fetchSessions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('interview_sessions')
        .select('*', { count: 'exact' })
        .eq('interviewer_id', user.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (languageFilter !== 'all') {
        query = query.eq('language', languageFilter);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      setSessions(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('session-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interview_sessions',
          filter: `interviewer_id=eq.${user.id}`
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filteredSessions = sessions.filter(session =>
    session.respondent_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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
    if (!completedAt) return '-';
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const diffMs = end.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setLanguageFilter('all');
    setCurrentPage(1);
  };

  const toggleSessionSelection = (sessionId: string) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedSessions.size === filteredSessions.length) {
      setSelectedSessions(new Set());
    } else {
      setSelectedSessions(new Set(filteredSessions.map(s => s.id)));
    }
  };

  const handleBatchExport = async () => {
    if (selectedSessions.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No sessions selected',
        description: 'Please select at least one session to export.',
      });
      return;
    }

    setExporting(true);
    setExportProgress({ current: 0, total: selectedSessions.size });

    try {
      await exportBatchToPDF(
        Array.from(selectedSessions),
        (current, total) => setExportProgress({ current, total })
      );
      toast({
        title: 'Export Complete',
        description: `Successfully exported ${selectedSessions.size} session(s) to PDF.`,
      });
      setSelectedSessions(new Set());
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to export sessions. Please try again.',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Session History
            </h1>
            <p className="text-muted-foreground">
              View and manage all your past interview sessions
            </p>
          </div>
          <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            New Session
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by respondent code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            <div className="flex flex-wrap gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="abandoned">Abandoned</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={languageFilter} onValueChange={setLanguageFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="id">Bahasa Indonesia</SelectItem>
                    <SelectItem value="ms">Bahasa Melayu</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={resetFilters} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                {selectedSessions.size > 0 && (
                  <Button 
                    onClick={handleBatchExport} 
                    disabled={exporting}
                    className="gap-2"
                  >
                    {exporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )}
                    Export {selectedSessions.size} PDF{selectedSessions.size > 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            </div>
            {exporting && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Exporting sessions...</span>
                  <span>{exportProgress.current} / {exportProgress.total}</span>
                </div>
                <Progress value={(exportProgress.current / exportProgress.total) * 100} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Interview Sessions</CardTitle>
            <CardDescription>
              {totalCount} total sessions found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No sessions found</p>
                <Link to="/interview">
                  <Button>Start Your First Interview</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground w-10">
                          <Checkbox
                            checked={selectedSessions.size === filteredSessions.length && filteredSessions.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Respondent</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Language</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Current Step</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Duration</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map((session) => (
                        <tr key={session.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-4 px-2">
                            <Checkbox
                              checked={selectedSessions.has(session.id)}
                              onCheckedChange={() => toggleSessionSelection(session.id)}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium text-foreground">{session.respondent_code}</span>
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(session.status)}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-muted-foreground">
                              {getLanguageLabel(session.language)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-muted-foreground capitalize">
                              {session.current_step.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(session.created_at), 'MMM dd, yyyy')}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {calculateDuration(session.started_at, session.completed_at)}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {session.status === 'in_progress' && (
                                <Link to={`/interview?resume=${session.id}`}>
                                  <Button variant="default" size="sm" className="gap-1">
                                    <Play className="h-4 w-4" />
                                    Resume
                                  </Button>
                                </Link>
                              )}
                              <Link to={`/sessions/${session.id}`}>
                                <Button variant="ghost" size="sm" className="gap-1">
                                  <Eye className="h-4 w-4" />
                                  View
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} sessions
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground px-2">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <CreateSessionDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </div>
  );
}
