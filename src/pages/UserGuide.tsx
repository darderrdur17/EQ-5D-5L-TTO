import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Play, 
  ClipboardList, 
  Users, 
  Download, 
  Shield, 
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Settings,
  FileText,
  GraduationCap,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { InteractiveTTOTutorial } from '@/components/guide/InteractiveTTOTutorial';
import { QuickReferenceCard } from '@/components/guide/QuickReferenceCard';

export default function UserGuide() {
  const { t } = useTranslation();
  const { isAdmin, isInterviewer } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-4 md:py-8 px-4 md:px-6">
        <div className="mb-6 md:mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            User Guide
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Complete documentation for using the EQ-5D-5L TTO Survey Platform
          </p>
        </div>

        <Tabs defaultValue="tutorial" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3 h-auto">
            <TabsTrigger value="tutorial" className="gap-1 md:gap-2 text-xs md:text-sm py-2">
              <GraduationCap className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Interactive</span> Tutorial
            </TabsTrigger>
            <TabsTrigger value="interviewer" className="gap-1 md:gap-2 text-xs md:text-sm py-2">
              <Users className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Interviewer</span> Guide
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-1 md:gap-2 text-xs md:text-sm py-2">
              <Shield className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Admin</span> Guide
            </TabsTrigger>
          </TabsList>

          {/* Interactive Tutorial Tab */}
          <TabsContent value="tutorial" className="space-y-6">
            <InteractiveTTOTutorial />
            <QuickReferenceCard />
          </TabsContent>

          {/* Interviewer Guide */}
          <TabsContent value="interviewer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2 text-lg md:text-xl">
                  <Play className="h-5 w-5 text-primary" />
                  Getting Started
                </CardTitle>
                <CardDescription>How to begin using the platform</CardDescription>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <ol className="space-y-4">
                  <li>
                    <strong>Login to your account</strong> - Use the credentials provided by your administrator
                  </li>
                  <li>
                    <strong>Access the Dashboard</strong> - View your session statistics and recent activity
                  </li>
                  <li>
                    <strong>Start a New Interview</strong> - Click "Start Interview" and enter the respondent code
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2 text-lg md:text-xl">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Conducting Interviews
                </CardTitle>
                <CardDescription>Step-by-step interview process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:gap-4">
                  <div className="flex gap-3 md:gap-4 p-3 md:p-4 bg-muted/50 rounded-lg">
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs md:text-sm font-bold text-primary">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm md:text-base">Consent</h4>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Obtain informed consent from the participant before proceeding
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 md:gap-4 p-3 md:p-4 bg-muted/50 rounded-lg">
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs md:text-sm font-bold text-primary">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm md:text-base">EQ-5D-5L Questionnaire</h4>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Complete the 5 dimension health state assessment plus VAS score
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 md:gap-4 p-3 md:p-4 bg-muted/50 rounded-lg">
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs md:text-sm font-bold text-primary">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm md:text-base">Wheelchair Practice</h4>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Introduce the TTO concept using the wheelchair example
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 md:gap-4 p-3 md:p-4 bg-muted/50 rounded-lg">
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs md:text-sm font-bold text-primary">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm md:text-base">TTO Tasks</h4>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Complete 10 TTO valuation tasks with the participant
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 md:gap-4 p-3 md:p-4 bg-muted/50 rounded-lg">
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs md:text-sm font-bold text-primary">5</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm md:text-base">Demographics</h4>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Collect demographic information at the end of the session
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2 text-lg">
                    <QrCode className="h-5 w-5 text-primary" />
                    Using QR Codes
                  </CardTitle>
                  <CardDescription>Allow participants to access surveys via QR code</CardDescription>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                  <ul className="space-y-2 text-sm">
                    <li>Generate QR codes from the dashboard for participants to scan</li>
                    <li>Optionally pre-fill respondent codes in the QR link</li>
                    <li>Select the appropriate language for each participant</li>
                    <li>Download QR codes as images to print or share</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Session Notes
                  </CardTitle>
                  <CardDescription>Documenting observations during interviews</CardDescription>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                  <ul className="space-y-2 text-sm">
                    <li>Add notes during or after interviews to document observations</li>
                    <li>Notes are visible to administrators during quality review</li>
                    <li>Include any issues, clarifications, or notable responses</li>
                    <li>Edit or delete your own notes as needed</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admin Guide */}
          <TabsContent value="admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2 text-lg md:text-xl">
                  <Settings className="h-5 w-5 text-primary" />
                  Administration Overview
                </CardTitle>
                <CardDescription>Managing the survey platform</CardDescription>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p>
                  As an administrator, you have access to all system features including user management,
                  data export, quality review, and analytics.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2 text-lg md:text-xl">
                  <Download className="h-5 w-5 text-primary" />
                  Data Export
                </CardTitle>
                <CardDescription>Exporting survey data for analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="p-3 md:p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 mb-2 text-sm md:text-base">
                      <FileText className="h-4 w-4" />
                      CSV Export
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Export all data including sessions, responses, notes, and quality flags in CSV format
                      for use in Excel, SPSS, or other analysis tools.
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 mb-2 text-sm md:text-base">
                      <FileText className="h-4 w-4" />
                      JSON Export
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Export complete data in JSON format for programmatic analysis or data archival.
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 mb-2 text-sm md:text-base">
                      <FileText className="h-4 w-4" />
                      PDF Reports
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Generate individual or batch PDF reports for sessions with formatted response data.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    Quality Review Workflow
                  </CardTitle>
                  <CardDescription>Reviewing and approving session data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex gap-3 items-start p-3 border rounded-lg">
                      <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-[10px] md:text-xs font-medium">Pending</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Pending Review</h4>
                        <p className="text-xs text-muted-foreground">
                          New sessions awaiting quality review
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start p-3 border rounded-lg">
                      <CheckCircle2 className="h-6 w-6 md:h-8 md:w-8 text-emerald-500" />
                      <div>
                        <h4 className="font-semibold text-sm">Approved</h4>
                        <p className="text-xs text-muted-foreground">
                          Sessions that pass quality checks
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start p-3 border rounded-lg">
                      <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-amber-500" />
                      <div>
                        <h4 className="font-semibold text-sm">Flagged</h4>
                        <p className="text-xs text-muted-foreground">
                          Sessions requiring further review
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    User Management
                  </CardTitle>
                  <CardDescription>Managing interviewers and administrators</CardDescription>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                  <ul className="space-y-2 text-sm">
                    <li>Create new user accounts for interviewers</li>
                    <li>Assign roles (Administrator or Interviewer)</li>
                    <li>Monitor interviewer performance metrics</li>
                    <li>View activity logs and session history per user</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
