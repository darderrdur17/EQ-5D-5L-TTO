import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  ClipboardList, 
  Download, 
  TrendingUp,
  Activity,
  Settings,
  BarChart3,
  FileSpreadsheet,
  UserPlus,
  ChevronRight,
  Globe,
  Shield,
  FileJson,
  Loader2,
  BookOpen,
  QrCode,
  Award
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { fetchExportData, exportToCSV, exportToJSON } from '@/utils/exportData';
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts';
import { ComprehensiveAnalytics } from '@/components/admin/ComprehensiveAnalytics';
import { QRCodeGenerator } from '@/components/session/QRCodeGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data
const MOCK_ADMIN_STATS = {
  totalUsers: 12,
  activeInterviewers: 8,
  totalSessions: 342,
  completedSessions: 318,
  avgResponseTime: '17.5 min',
  dataQualityScore: 94,
};

const MOCK_QUOTA_PROGRESS = [
  { name: 'Age 18-34', target: 50, current: 42, percentage: 84 },
  { name: 'Age 35-54', target: 50, current: 48, percentage: 96 },
  { name: 'Age 55+', target: 50, current: 38, percentage: 76 },
  { name: 'Male', target: 75, current: 62, percentage: 83 },
  { name: 'Female', target: 75, current: 66, percentage: 88 },
];

const MOCK_INTERVIEWERS = [
  { id: '1', name: 'Dr. Sarah Chen', sessions: 45, completionRate: 96, lastActive: '2 hours ago' },
  { id: '2', name: 'James Wilson', sessions: 38, completionRate: 91, lastActive: '30 min ago' },
  { id: '3', name: 'Maria Garcia', sessions: 52, completionRate: 98, lastActive: '1 hour ago' },
  { id: '4', name: 'David Kim', sessions: 29, completionRate: 89, lastActive: '3 hours ago' },
];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState<'csv' | 'json' | null>(null);

  const handleExportCSV = async () => {
    setIsExporting('csv');
    try {
      const data = await fetchExportData();
      exportToCSV(data);
      toast({
        title: t('common.success'),
        description: 'Data exported successfully as CSV',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to export data',
      });
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting('json');
    try {
      const data = await fetchExportData();
      exportToJSON(data);
      toast({
        title: t('common.success'),
        description: 'Data exported successfully as JSON',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Failed to export data',
      });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              {t('admin.title')}
            </h1>
            <p className="text-muted-foreground">
              System overview and management for EQ-5D-5L TTO Survey
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleExportCSV}
              disabled={isExporting !== null}
            >
              {isExporting === 'csv' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              {t('admin.exportCSV')}
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleExportJSON}
              disabled={isExporting !== null}
            >
              {isExporting === 'json' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4" />
              )}
              {t('admin.exportJSON')}
            </Button>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="qr-codes" className="gap-2">
              <QrCode className="h-4 w-4" />
              QR Codes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{MOCK_ADMIN_STATS.totalUsers}</p>
                      <p className="text-sm text-muted-foreground">{t('admin.users')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                      <ClipboardList className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{MOCK_ADMIN_STATS.completedSessions}</p>
                      <p className="text-sm text-muted-foreground">{t('dashboard.completedSessions')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{MOCK_ADMIN_STATS.activeInterviewers}</p>
                      <p className="text-sm text-muted-foreground">Active Interviewers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-info" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{MOCK_ADMIN_STATS.dataQualityScore}%</p>
                      <p className="text-sm text-muted-foreground">Data Quality</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Quota Progress */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-display">{t('admin.quotaProgress')}</CardTitle>
                      <CardDescription>Recruitment targets by demographic group</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <BarChart3 className="h-4 w-4" />
                      Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {MOCK_QUOTA_PROGRESS.map((quota) => (
                      <div key={quota.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{quota.name}</span>
                          <span className="text-muted-foreground">
                            {quota.current} / {quota.target}
                          </span>
                        </div>
                        <Progress value={quota.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display">Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3"
                    onClick={handleExportCSV}
                    disabled={isExporting !== null}
                  >
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    {t('admin.exportCSV')}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3"
                    onClick={handleExportJSON}
                    disabled={isExporting !== null}
                  >
                    <FileJson className="h-4 w-4 text-primary" />
                    {t('admin.exportJSON')}
                  </Button>
                  <Link to="/admin/users">
                    <Button variant="outline" className="w-full justify-start gap-3">
                      <Users className="h-4 w-4 text-primary" />
                      {t('admin.users')}
                    </Button>
                  </Link>
                  <Link to="/admin/quality-review">
                    <Button variant="outline" className="w-full justify-start gap-3">
                      <Shield className="h-4 w-4 text-primary" />
                      Quality Review
                    </Button>
                  </Link>
                  <Link to="/admin/performance">
                    <Button variant="outline" className="w-full justify-start gap-3">
                      <Award className="h-4 w-4 text-primary" />
                      Performance Reports
                    </Button>
                  </Link>
                  <Link to="/guide">
                    <Button variant="outline" className="w-full justify-start gap-3">
                      <BookOpen className="h-4 w-4 text-primary" />
                      User Guide
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <Globe className="h-4 w-4 text-primary" />
                    Language Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <Settings className="h-4 w-4 text-primary" />
                    System Settings
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Interviewer Performance */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-display">{t('admin.interviewerPerformance')}</CardTitle>
                    <CardDescription>Overview of interviewer activity and metrics</CardDescription>
                  </div>
                  <Link to="/admin/performance">
                    <Button variant="ghost" size="sm" className="gap-1">
                      View all <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Interviewer</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('admin.sessions')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Completion Rate</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Last Active</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_INTERVIEWERS.map((interviewer) => (
                        <tr key={interviewer.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {interviewer.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <span className="font-medium text-foreground">{interviewer.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-foreground">{interviewer.sessions}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Progress value={interviewer.completionRate} className="w-16 h-2" />
                              <span className="text-sm text-muted-foreground">{interviewer.completionRate}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-muted-foreground text-sm">{interviewer.lastActive}</td>
                          <td className="py-4 px-4 text-right">
                            <Button variant="ghost" size="sm">View Details</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <ComprehensiveAnalytics />
          </TabsContent>

          <TabsContent value="qr-codes">
            <div className="max-w-2xl">
              <QRCodeGenerator />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
