import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { TTOVisualization } from '@/components/tto/TTOVisualization';
import { EQ5DQuestionnaire } from '@/components/interview/EQ5DQuestionnaire';
import { AICopilot } from '@/components/copilot/AICopilot';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { notifyInterviewCompleted } from '@/utils/notifications';

type InterviewStep = 'consent' | 'warmup' | 'practice' | 'tto' | 'feedback' | 'dce' | 'demographics' | 'complete';

// Sample health states for demo
const SAMPLE_HEALTH_STATES = [
  { mobility: 2, selfCare: 1, usualActivities: 2, painDiscomfort: 3, anxietyDepression: 1 },
  { mobility: 3, selfCare: 2, usualActivities: 3, painDiscomfort: 2, anxietyDepression: 2 },
  { mobility: 1, selfCare: 1, usualActivities: 2, painDiscomfort: 4, anxietyDepression: 3 },
];

export default function Interview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const resumeSessionId = searchParams.get('resume');
  
  const [sessionId, setSessionId] = useState<string | null>(resumeSessionId);
  const [currentStep, setCurrentStep] = useState<InterviewStep>('consent');
  const [currentTTOTask, setCurrentTTOTask] = useState(0);
  const [ttoValues, setTTOValues] = useState<number[]>([]);
  const [showCopilot, setShowCopilot] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [eq5dResponses, setEq5dResponses] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if no session ID provided
  useEffect(() => {
    if (!resumeSessionId) {
      navigate('/dashboard');
    }
  }, [resumeSessionId, navigate]);

  // Load existing session if resuming
  useEffect(() => {
    if (resumeSessionId && user) {
      loadExistingSession(resumeSessionId);
    }
  }, [resumeSessionId, user]);

  const loadExistingSession = async (id: string) => {
    setLoading(true);
    try {
      // Fetch session details
      const { data: session, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!session) {
        navigate('/sessions');
        return;
      }

      setSessionId(session.id);
      setCurrentStep(session.current_step as InterviewStep);
      setHasConsented(session.current_step !== 'consent');

      // Fetch existing EQ-5D responses
      const { data: eq5dData } = await supabase
        .from('eq5d_responses')
        .select('*')
        .eq('session_id', id)
        .maybeSingle();
      
      if (eq5dData) {
        setEq5dResponses(eq5dData);
      }

      // Fetch existing TTO responses
      const { data: ttoData } = await supabase
        .from('tto_responses')
        .select('*')
        .eq('session_id', id)
        .order('task_number', { ascending: true });
      
      if (ttoData && ttoData.length > 0) {
        setTTOValues(ttoData.map(r => Number(r.final_value)));
        setCurrentTTOTask(ttoData.length);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      navigate('/sessions');
    } finally {
      setLoading(false);
    }
  };

  const updateSessionStep = async (step: InterviewStep) => {
    if (!sessionId) return;
    
    try {
      const updateData: any = { current_step: step };
      if (step === 'complete') {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
      }
      
      await supabase
        .from('interview_sessions')
        .update(updateData)
        .eq('id', sessionId);

      // Send notification when interview is completed
      if (step === 'complete' && user) {
        // Get respondent code for the notification
        const { data: session } = await supabase
          .from('interview_sessions')
          .select('respondent_code')
          .eq('id', sessionId)
          .single();
        
        if (session) {
          notifyInterviewCompleted(sessionId, session.respondent_code, user.id);
        }
      }
    } catch (error) {
      console.error('Error updating session step:', error);
    }
  };

  const STEPS: { id: InterviewStep; label: string }[] = [
    { id: 'consent', label: t('interview.steps.consent') },
    { id: 'warmup', label: t('interview.steps.warmup') },
    { id: 'practice', label: t('interview.steps.practice') },
    { id: 'tto', label: t('interview.steps.tto') },
    { id: 'feedback', label: t('interview.steps.feedback') },
    { id: 'dce', label: t('interview.steps.dce') },
    { id: 'demographics', label: t('interview.steps.demographics') },
    { id: 'complete', label: t('interview.steps.complete') },
  ];

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const progressPercentage = ((currentStepIndex) / (STEPS.length - 1)) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      const nextStep = STEPS[nextIndex].id;
      setCurrentStep(nextStep);
      updateSessionStep(nextStep);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = STEPS[prevIndex].id;
      setCurrentStep(prevStep);
      updateSessionStep(prevStep);
    }
  };

  const handleTTOComplete = (value: number) => {
    const newValues = [...ttoValues, value];
    setTTOValues(newValues);
    
    if (currentTTOTask < SAMPLE_HEALTH_STATES.length - 1) {
      setCurrentTTOTask(currentTTOTask + 1);
    } else {
      handleNext();
    }
  };

  const handleEQ5DComplete = (responses: any) => {
    setEq5dResponses(responses);
    handleNext();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'consent':
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="font-display text-2xl">{t('interview.consent.title')}</CardTitle>
              <CardDescription>
                {t('interview.consent.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">
                  You are being invited to participate in a research study about health state valuation. 
                  This study uses the Time Trade-Off (TTO) method to understand how people value different 
                  health conditions.
                </p>
                <h4 className="font-semibold text-foreground mt-4">What will you be asked to do?</h4>
                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                  <li>Complete a brief questionnaire about your current health</li>
                  <li>Complete 10 Time Trade-Off tasks comparing different health states</li>
                  <li>Answer some demographic questions</li>
                </ul>
                <h4 className="font-semibold text-foreground mt-4">How long will it take?</h4>
                <p className="text-muted-foreground">
                  The interview typically takes 15-25 minutes to complete.
                </p>
                <h4 className="font-semibold text-foreground mt-4">Confidentiality</h4>
                <p className="text-muted-foreground">
                  Your responses will be kept confidential and used only for research purposes. 
                  No personally identifiable information will be published.
                </p>
              </div>
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <input
                  type="checkbox"
                  id="consent"
                  checked={hasConsented}
                  onChange={(e) => setHasConsented(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                />
                <label htmlFor="consent" className="text-sm text-foreground cursor-pointer">
                  {t('interview.consent.agree')}
                </label>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!hasConsented}
                className="w-full"
                size="lg"
              >
                {t('common.next')}
              </Button>
            </CardContent>
          </Card>
        );

      case 'warmup':
        return <EQ5DQuestionnaire onComplete={handleEQ5DComplete} />;

      case 'practice':
        return (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="font-display text-2xl">{t('interview.practice.title')}</CardTitle>
              <CardDescription>
                {t('interview.practice.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-muted/30 rounded-lg space-y-4">
                <h4 className="font-semibold text-foreground">Understanding the Task</h4>
                <p className="text-muted-foreground">
                  Imagine you had to choose between two options:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-tto-life-a/10 border-2 border-tto-life-a/30 rounded-lg">
                    <h5 className="font-semibold text-tto-life-a mb-2">{t('interview.tto.lifeA')}</h5>
                    <p className="text-sm text-muted-foreground">
                      Living for 10 years confined to a wheelchair, but otherwise healthy
                    </p>
                  </div>
                  <div className="p-4 bg-tto-life-b/10 border-2 border-tto-life-b/30 rounded-lg">
                    <h5 className="font-semibold text-tto-life-b mb-2">{t('interview.tto.lifeB')}</h5>
                    <p className="text-sm text-muted-foreground">
                      Living for a shorter time in perfect health (able to walk)
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {t('interview.tto.instructions')}
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePrevious} className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  {t('common.back')}
                </Button>
                <Button onClick={handleNext} className="flex-1 gap-2">
                  {t('common.next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'tto':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {t('interview.tto.taskNumber', { number: currentTTOTask + 1, total: SAMPLE_HEALTH_STATES.length })}
              </span>
            </div>
            <TTOVisualization
              healthState={SAMPLE_HEALTH_STATES[currentTTOTask]}
              healthStateLabel={String(currentTTOTask + 1)}
              onComplete={handleTTOComplete}
            />
          </div>
        );

      case 'feedback':
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="font-display text-2xl">{t('interview.feedback.title')}</CardTitle>
              <CardDescription>
                {t('interview.feedback.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {ttoValues.map((value, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <span className="font-medium">{t('interview.tto.healthState')} {index + 1}</span>
                    <span className="text-lg font-bold text-primary">{value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePrevious} className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  {t('common.back')}
                </Button>
                <Button onClick={handleNext} className="flex-1 gap-2">
                  {t('common.next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'dce':
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="font-display text-2xl">{t('interview.dce.title')}</CardTitle>
              <CardDescription>
                {t('interview.dce.choosePreferred')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                In a full interview, you would complete 7 paired comparisons between different 
                health states. For this demo, we'll skip ahead.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePrevious} className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  {t('common.back')}
                </Button>
                <Button onClick={handleNext} className="flex-1 gap-2">
                  {t('common.next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'demographics':
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="font-display text-2xl">{t('interview.demographics.title')}</CardTitle>
              <CardDescription>
                {t('interview.demographics.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                In a full interview, you would answer questions about your age, gender, 
                education, and other background information. For this demo, we'll skip ahead.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePrevious} className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  {t('common.back')}
                </Button>
                <Button onClick={handleNext} className="flex-1 gap-2">
                  {t('common.submit')}
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'complete':
        return (
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="py-12 space-y-6">
              <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  {t('interview.complete.title')}
                </h2>
                <p className="text-muted-foreground">
                  {t('interview.complete.thankYou')}
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Session ID: <span className="font-mono font-semibold">TTO-2024-{Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                </p>
              </div>
              <Button onClick={() => navigate('/dashboard')} size="lg">
                {t('nav.dashboard')}
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading session...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-4 sm:py-8 px-3 sm:px-4">
        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mb-4 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[60%]">
              {STEPS[currentStepIndex].label}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {currentStepIndex + 1} / {STEPS.length}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          
          {/* Step indicators - hidden on mobile, shown on tablet+ */}
          <div className="hidden sm:flex justify-between mt-3">
            {STEPS.map((step, index) => (
              <div 
                key={step.id}
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-full text-xs font-medium transition-colors",
                  index < currentStepIndex && "bg-primary text-primary-foreground",
                  index === currentStepIndex && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  index > currentStepIndex && "bg-muted text-muted-foreground"
                )}
              >
                {index < currentStepIndex ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
            ))}
          </div>
          
          {/* Mobile step indicator - only current step with dots */}
          <div className="flex sm:hidden items-center justify-center gap-1.5 mt-3">
            {STEPS.map((step, index) => (
              <div 
                key={step.id}
                className={cn(
                  "rounded-full transition-all duration-300",
                  index === currentStepIndex 
                    ? "h-2.5 w-6 bg-primary" 
                    : index < currentStepIndex 
                      ? "h-2 w-2 bg-primary/60"
                      : "h-2 w-2 bg-muted"
                )}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        {renderStepContent()}

        {/* AI Copilot */}
        <AICopilot
          stage={currentStep}
          sessionContext={{
            currentTTOTask,
            ttoValues,
            eq5dResponses,
          }}
          isOpen={showCopilot}
          onToggle={() => setShowCopilot(!showCopilot)}
        />
      </main>
    </div>
  );
}
