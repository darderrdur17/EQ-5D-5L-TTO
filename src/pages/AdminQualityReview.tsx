import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Flag, 
  Clock,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Search,
  Calendar as CalendarIcon,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface SessionForReview {
  id: string;
  respondent_code: string;
  status: string;
  language: string;
  quality_status: string | null;
  quality_reviewed_at: string | null;
  created_at: string;
  completed_at: string | null;
  interviewer_id: string;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

interface Interviewer {
  id: string;
  name: string;
  email: string;
}

const ITEMS_PER_PAGE = 15;

export default function AdminQualityReview() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<SessionForReview[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [qualityFilter, setQualityFilter] = useState<string>('pending');
  const [interviewerFilter, setInterviewerFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchInterviewers();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [currentPage, statusFilter, qualityFilter, interviewerFilter, dateRange]);

  const fetchInterviewers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'interviewer');

      setInterviewers(
        (data || []).map(p => ({
          id: p.id,
          name: p.full_name || '',
          email: p.email
        }))
      );
    } catch (error) {
      console.error('Error fetching interviewers:', error);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('interview_sessions')
        .select(`
          id,
          respondent_code,
          status,
          language,
          quality_status,
          quality_reviewed_at,
          created_at,
          completed_at,
          interviewer_id,
          profiles!interview_sessions_interviewer_id_fkey (
            full_name,
            email
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (qualityFilter !== 'all') {
        if (qualityFilter === 'pending') {
          query = query.or('quality_status.is.null,quality_status.eq.pending');
        } else {
          query = query.eq('quality_status', qualityFilter);
        }
      }

      if (interviewerFilter !== 'all') {
        query = query.eq('interviewer_id', interviewerFilter);
      }

      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
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

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const filteredSessions = sessions.filter(session =>
    session.respondent_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getQualityBadge = (status: string | null) => {
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
            Pending
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-success/10 text-success">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-warning/10 text-warning">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setQualityFilter('pending');
    setInterviewerFilter('all');
    setDateRange(undefined);
    setCurrentPage(1);
  };

  const hasActiveFilters = 
    searchTerm !== '' ||
    statusFilter !== 'all' ||
    qualityFilter !== 'pending' ||
    interviewerFilter !== 'all' ||
    dateRange !== undefined;

  // Calculate stats
  const stats = {
    pending: sessions.filter(s => !s.quality_status || s.quality_status === 'pending').length,
    approved: sessions.filter(s => s.quality_status === 'approved').length,
    flagged: sessions.filter(s => s.quality_status === 'flagged').length,
    rejected: sessions.filter(s => s.quality_status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Quality Review
          </h1>
          <p className="text-muted-foreground">
            Review and approve interview session data quality
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="cursor-pointer hover:border-primary/50" onClick={() => setQualityFilter('pending')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-success/50" onClick={() => setQualityFilter('approved')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-warning/50" onClick={() => setQualityFilter('flagged')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Flag className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.flagged}</p>
                  <p className="text-sm text-muted-foreground">Flagged</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-destructive/50" onClick={() => setQualityFilter('rejected')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by respondent code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Select value={qualityFilter} onValueChange={setQualityFilter}>
                    <SelectTrigger className="w-[160px]">
                      <Shield className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Quality Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Quality</SelectItem>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Session Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sessions</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={interviewerFilter} onValueChange={setInterviewerFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Interviewer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Interviewers</SelectItem>
                      {interviewers.map((interviewer) => (
                        <SelectItem key={interviewer.id} value={interviewer.id}>
                          {interviewer.name || interviewer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Date Range Picker */}
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[220px] justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "MMM dd")} -{" "}
                              {format(dateRange.to, "MMM dd")}
                            </>
                          ) : (
                            format(dateRange.from, "MMM dd, yyyy")
                          )
                        ) : (
                          "Date range"
                        )}
                        {dateRange && (
                          <X 
                            className="ml-auto h-4 w-4 hover:text-destructive" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDateRange(undefined);
                            }}
                          />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>

                  {hasActiveFilters && (
                    <Button variant="outline" onClick={resetFilters} className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Sessions for Review</CardTitle>
            <CardDescription>
              {totalCount} sessions found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sessions match your filters</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Respondent</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Interviewer</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Quality</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map((session) => (
                        <tr key={session.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="font-medium text-foreground">{session.respondent_code}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-muted-foreground">
                              {session.profiles?.full_name || session.profiles?.email || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(session.status)}
                          </td>
                          <td className="py-4 px-4">
                            {getQualityBadge(session.quality_status)}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(session.created_at), 'MMM dd, yyyy')}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Link to={`/sessions/${session.id}`}>
                              <Button variant="ghost" size="sm" className="gap-1">
                                <Eye className="h-4 w-4" />
                                Review
                              </Button>
                            </Link>
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
                      Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}
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
    </div>
  );
}
