import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  CheckCircle2, 
  Lightbulb,
  AlertCircle,
  RotateCcw,
  BookOpen,
  Target,
  Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  content: React.ReactNode;
  tips: string[];
  warnings?: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: "Understanding Time Trade-Off (TTO)",
    description: "Learn the core concept of health state valuation",
    content: (
      <div className="space-y-4">
        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
          <h4 className="font-semibold text-primary mb-2">What is TTO?</h4>
          <p className="text-sm text-muted-foreground">
            Time Trade-Off (TTO) is a method to measure how people value different health states. 
            Participants choose between living in a specific health state for a full duration (e.g., 10 years) 
            versus living in perfect health for a shorter duration.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 font-bold">A</span>
              </div>
              <span className="font-medium">Option A</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Live in the described health state for 10 years, then die
            </p>
          </div>
          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">B</span>
              </div>
              <span className="font-medium">Option B</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Live in perfect health for X years (variable), then die
            </p>
          </div>
        </div>
      </div>
    ),
    tips: [
      "The TTO value reflects how much life a person would trade to avoid a health state",
      "A value of 1.0 means the health state is equivalent to perfect health",
      "A value of 0.0 means the health state is equivalent to being dead"
    ]
  },
  {
    id: 2,
    title: "Setting Up the Interview",
    description: "Prepare for a successful TTO interview session",
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
            <div>
              <p className="font-medium">Create a new session</p>
              <p className="text-sm text-muted-foreground">Enter the respondent code and select language</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
            <div>
              <p className="font-medium">Obtain informed consent</p>
              <p className="text-sm text-muted-foreground">Ensure participant understands and agrees</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
            <div>
              <p className="font-medium">Complete EQ-5D-5L questionnaire</p>
              <p className="text-sm text-muted-foreground">Assess their current health state</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</div>
            <div>
              <p className="font-medium">Practice with wheelchair example</p>
              <p className="text-sm text-muted-foreground">Help them understand the TTO concept</p>
            </div>
          </div>
        </div>
      </div>
    ),
    tips: [
      "Ensure a quiet, comfortable environment for the interview",
      "Have the respondent code ready before starting",
      "Allow time for questions during consent"
    ],
    warnings: [
      "Never proceed without proper consent",
      "Do not rush through the practice task"
    ]
  },
  {
    id: 3,
    title: "Using the TTO Slider",
    description: "Master the interactive valuation tool",
    content: (
      <div className="space-y-4">
        <div className="border rounded-lg p-4 bg-gradient-to-r from-orange-50 to-emerald-50 dark:from-orange-950/20 dark:to-emerald-950/20">
          <div className="flex justify-between mb-4">
            <div className="text-center">
              <div className="h-16 w-24 bg-orange-200 dark:bg-orange-800 rounded mb-2 flex items-center justify-center">
                <span className="text-xs font-medium">Health State</span>
              </div>
              <span className="text-sm">10 years</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <Scale className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <div className="h-16 w-24 bg-emerald-200 dark:bg-emerald-800 rounded mb-2 flex items-center justify-center">
                <span className="text-xs font-medium">Full Health</span>
              </div>
              <span className="text-sm">X years</span>
            </div>
          </div>
          <div className="h-3 bg-muted rounded-full relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 bg-primary rounded-full border-2 border-background shadow cursor-grab" />
          </div>
          <p className="text-xs text-center mt-2 text-muted-foreground">
            ← Drag slider to adjust years in full health →
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-medium">Slider Left (0 years)</p>
            <p className="text-muted-foreground">State is as bad as death</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-medium">Slider Right (10 years)</p>
            <p className="text-muted-foreground">State equals full health</p>
          </div>
        </div>
      </div>
    ),
    tips: [
      "Ask participants to find where they feel truly indifferent",
      "Encourage them to try different positions before deciding",
      "Explain that there are no right or wrong answers"
    ]
  },
  {
    id: 4,
    title: "Handling 'Worse Than Death' States",
    description: "Guide participants through difficult health states",
    content: (
      <div className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span className="font-medium text-amber-800 dark:text-amber-200">Lead-Time TTO</span>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            When a participant indicates they would prefer death to the health state, 
            we use a modified approach called Lead-Time TTO.
          </p>
        </div>
        <div className="space-y-3">
          <div className="p-3 border rounded-lg">
            <p className="font-medium mb-1">Step 1: Acknowledge the preference</p>
            <p className="text-sm text-muted-foreground">
              "You've indicated this health state feels worse than being dead. That's a valid response."
            </p>
          </div>
          <div className="p-3 border rounded-lg">
            <p className="font-medium mb-1">Step 2: Explain lead-time approach</p>
            <p className="text-sm text-muted-foreground">
              "Now imagine 10 years in full health FOLLOWED BY 10 years in this state."
            </p>
          </div>
          <div className="p-3 border rounded-lg">
            <p className="font-medium mb-1">Step 3: Find new indifference point</p>
            <p className="text-sm text-muted-foreground">
              "How many total years would make this equal to immediate death?"
            </p>
          </div>
        </div>
      </div>
    ),
    tips: [
      "Remain neutral and non-judgmental",
      "This is a sensitive topic - proceed with care",
      "The calculation produces negative values (below 0)"
    ],
    warnings: [
      "Never express surprise or judgment at WTD responses",
      "Allow participants time to process the scenario"
    ]
  },
  {
    id: 5,
    title: "Recording and Quality Checks",
    description: "Ensure accurate data collection",
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-2 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Good Response Indicators
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>✓ Multiple slider adjustments</p>
              <p>✓ Time spent considering options</p>
              <p>✓ Questions about scenarios</p>
              <p>✓ Consistent logic across tasks</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Quality Flags
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>⚠ All values identical (e.g., all 0.5)</p>
              <p>⚠ Very fast responses (&lt;10 seconds)</p>
              <p>⚠ No slider movement at all</p>
              <p>⚠ Inconsistent severity patterns</p>
            </CardContent>
          </Card>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="font-medium mb-2">Adding Session Notes</p>
          <p className="text-sm text-muted-foreground">
            Document any unusual circumstances, interruptions, or participant comments 
            that might affect data quality. Notes are reviewed by administrators.
          </p>
        </div>
      </div>
    ),
    tips: [
      "Add notes immediately while details are fresh",
      "Note any environmental factors affecting the interview",
      "Document if participant needed extra explanation"
    ]
  },
  {
    id: 6,
    title: "Completing the Interview",
    description: "Wrap up and ensure data integrity",
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-medium">Complete all 10 TTO tasks</p>
              <p className="text-sm text-muted-foreground">Ensure each health state has been valued</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-medium">Collect demographics</p>
              <p className="text-sm text-muted-foreground">Age, gender, education, employment status</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-medium">Thank the participant</p>
              <p className="text-sm text-muted-foreground">Express appreciation for their time</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-medium">Review session notes</p>
              <p className="text-sm text-muted-foreground">Add any final observations before submitting</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm">
            <strong>Tip:</strong> Sessions are automatically saved. If you need to pause, 
            you can resume later from the Session History page.
          </p>
        </div>
      </div>
    ),
    tips: [
      "Review the session summary before marking complete",
      "Verify all required fields are filled",
      "Submit session notes promptly"
    ]
  }
];

export function InteractiveTTOTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const step = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Interactive TTO Tutorial
            </CardTitle>
            <CardDescription>
              Step-by-step guide to conducting TTO interviews
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Target className="h-3 w-3" />
              {completedSteps.length}/{tutorialSteps.length} Complete
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Progress value={progress} className="mt-4 h-2" />
      </CardHeader>

      <CardContent className="p-0">
        {/* Step Navigation */}
        <div className="flex overflow-x-auto border-b bg-muted/30 p-2 gap-1">
          {tutorialSteps.map((s, index) => (
            <button
              key={s.id}
              onClick={() => handleStepClick(index)}
              className={cn(
                "flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                "hover:bg-muted",
                currentStep === index
                  ? "bg-primary text-primary-foreground"
                  : completedSteps.includes(index)
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-background"
              )}
            >
              {completedSteps.includes(index) ? (
                <CheckCircle2 className="h-3 w-3 inline mr-1" />
              ) : (
                <span className="mr-1">{index + 1}.</span>
              )}
              <span className="hidden sm:inline">{s.title}</span>
              <span className="sm:hidden">Step {index + 1}</span>
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-4 md:p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">Step {step.id}</Badge>
              <h3 className="text-lg font-semibold">{step.title}</h3>
            </div>
            <p className="text-muted-foreground">{step.description}</p>
          </div>

          <div className="min-h-[200px]">
            {step.content}
          </div>

          {/* Tips */}
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800 dark:text-blue-200">Tips</span>
              </div>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                {step.tips.map((tip, index) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            </div>

            {step.warnings && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-800 dark:text-amber-200">Important</span>
                </div>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  {step.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/30">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            {currentStep + 1} of {tutorialSteps.length}
          </span>

          <Button
            onClick={handleNext}
            disabled={currentStep === tutorialSteps.length - 1}
          >
            {currentStep === tutorialSteps.length - 1 ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Complete
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
