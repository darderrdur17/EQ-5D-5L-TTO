import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeftRight, Check, RotateCcw } from 'lucide-react';

interface HealthState {
  mobility: number;
  selfCare: number;
  usualActivities: number;
  painDiscomfort: number;
  anxietyDepression: number;
}

interface TTOVisualizationProps {
  healthState: HealthState;
  healthStateLabel: string;
  onComplete: (value: number) => void;
  initialValue?: number;
}

const LEVELS = [
  'No problems',
  'Slight problems',
  'Moderate problems',
  'Severe problems',
  'Extreme problems / Unable',
];

const DIMENSIONS = [
  { key: 'mobility', label: 'Mobility' },
  { key: 'selfCare', label: 'Self-Care' },
  { key: 'usualActivities', label: 'Usual Activities' },
  { key: 'painDiscomfort', label: 'Pain / Discomfort' },
  { key: 'anxietyDepression', label: 'Anxiety / Depression' },
];

export function TTOVisualization({ 
  healthState, 
  healthStateLabel,
  onComplete,
  initialValue = 10 
}: TTOVisualizationProps) {
  const [yearsInLifeA, setYearsInLifeA] = useState(initialValue);
  const [isConfirming, setIsConfirming] = useState(false);

  const fullHealthYears = 10;

  const handleSliderChange = useCallback((value: number[]) => {
    setYearsInLifeA(value[0]);
    setIsConfirming(false);
  }, []);

  const handleConfirm = () => {
    if (isConfirming) {
      onComplete(yearsInLifeA / fullHealthYears);
    } else {
      setIsConfirming(true);
    }
  };

  const handleReset = () => {
    setYearsInLifeA(10);
    setIsConfirming(false);
  };

  const getHealthStateDescription = (level: number) => LEVELS[level - 1] || LEVELS[0];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-8 px-2 sm:px-0">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
          Time Trade-Off Task
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Compare living in the health state below versus living in full health for a shorter time
        </p>
      </div>

      {/* Health State Card */}
      <Card className="p-4 sm:p-6 bg-card border-2 border-border">
        <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-warning/20 text-warning text-sm font-bold flex-shrink-0">
            {healthStateLabel}
          </span>
          <span className="truncate">Health State Description</span>
        </h3>
        <div className="grid gap-2 sm:gap-3">
          {DIMENSIONS.map((dim) => (
            <div 
              key={dim.key}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-border/50 last:border-0 gap-1 sm:gap-0"
            >
              <span className="text-xs sm:text-sm font-medium text-foreground">{dim.label}</span>
              <span className={cn(
                "text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full w-fit",
                healthState[dim.key as keyof HealthState] === 1 && "bg-success/10 text-success",
                healthState[dim.key as keyof HealthState] === 2 && "bg-info/10 text-info",
                healthState[dim.key as keyof HealthState] === 3 && "bg-warning/10 text-warning",
                healthState[dim.key as keyof HealthState] >= 4 && "bg-destructive/10 text-destructive",
              )}>
                {getHealthStateDescription(healthState[dim.key as keyof HealthState])}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* TTO Visualization */}
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          {/* Life A - Health State */}
          <Card className="p-3 sm:p-6 border-2 border-tto-life-a/50 bg-tto-life-a/5">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
              <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-tto-life-a flex-shrink-0" />
              <h4 className="font-display text-sm sm:text-base font-semibold text-foreground">Life A</h4>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-xl sm:text-3xl font-bold text-tto-life-a">10 years</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Living with health state
              </p>
            </div>
          </Card>

          {/* Life B - Full Health */}
          <Card className="p-3 sm:p-6 border-2 border-tto-life-b/50 bg-tto-life-b/5">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
              <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-tto-life-b flex-shrink-0" />
              <h4 className="font-display text-sm sm:text-base font-semibold text-foreground">Life B</h4>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-xl sm:text-3xl font-bold text-tto-life-b">{yearsInLifeA} years</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Living in full health
              </p>
            </div>
          </Card>
        </div>

        {/* Timeline Visualization */}
        <Card className="p-4 sm:p-6 bg-muted/30">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
              <span>0 years</span>
              <span className="font-medium text-foreground hidden sm:inline">Timeline Comparison</span>
              <span>10 years</span>
            </div>
            
            {/* Life A Bar */}
            <div className="space-y-1 sm:space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Life A (Health State)</span>
              <div className="h-10 sm:h-12 rounded-lg bg-tto-life-a/20 overflow-hidden relative">
                <div 
                  className="h-full bg-tto-life-a transition-all duration-300 rounded-lg flex items-center justify-center"
                  style={{ width: '100%' }}
                >
                  <span className="text-xs sm:text-sm font-semibold text-primary-foreground">10 years</span>
                </div>
              </div>
            </div>

            {/* Life B Bar */}
            <div className="space-y-1 sm:space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Life B (Full Health)</span>
              <div className="h-10 sm:h-12 rounded-lg bg-tto-life-b/20 overflow-hidden relative">
                <div 
                  className="h-full bg-tto-life-b transition-all duration-300 rounded-lg flex items-center justify-center"
                  style={{ width: `${(yearsInLifeA / fullHealthYears) * 100}%` }}
                >
                  <span className="text-xs sm:text-sm font-semibold text-secondary-foreground">
                    {yearsInLifeA} years
                  </span>
                </div>
              </div>
            </div>

            {/* Slider */}
            <div className="pt-3 sm:pt-4 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 justify-center text-xs sm:text-sm text-muted-foreground text-center">
                <ArrowLeftRight className="h-4 w-4 flex-shrink-0 hidden sm:block" />
                <span>Adjust slider to find where both lives are equally preferable</span>
              </div>
              <Slider
                value={[yearsInLifeA]}
                onValueChange={handleSliderChange}
                min={0}
                max={10}
                step={0.5}
                className="w-full touch-pan-y"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 years</span>
                <span>10 years</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Result & Actions */}
        <Card className={cn(
          "p-4 sm:p-6 transition-all duration-300",
          isConfirming ? "border-2 border-success bg-success/5" : "bg-card"
        )}>
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">Implied health state value:</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {(yearsInLifeA / fullHealthYears).toFixed(2)}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button variant="outline" onClick={handleReset} className="gap-2 w-full sm:w-auto">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button 
                onClick={handleConfirm}
                variant={isConfirming ? "success" : "default"}
                className="gap-2 w-full sm:w-auto"
                size="lg"
              >
                <Check className="h-4 w-4" />
                {isConfirming ? "Confirm" : "I'm Indifferent"}
              </Button>
            </div>
          </div>
          {isConfirming && (
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-success text-center animate-fade-in">
              Tap "Confirm" to lock in this value, or adjust the slider.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
