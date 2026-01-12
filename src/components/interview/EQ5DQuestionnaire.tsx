import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EQ5DResponse {
  mobility: number;
  selfCare: number;
  usualActivities: number;
  painDiscomfort: number;
  anxietyDepression: number;
  vasScore: number;
}

interface EQ5DQuestionnaireProps {
  onComplete: (responses: EQ5DResponse) => void;
}

const dimensions = [
  { key: 'mobility', translationKey: 'mobility' },
  { key: 'selfCare', translationKey: 'selfCare' },
  { key: 'usualActivities', translationKey: 'usualActivities' },
  { key: 'painDiscomfort', translationKey: 'painDiscomfort' },
  { key: 'anxietyDepression', translationKey: 'anxietyDepression' },
] as const;

export const EQ5DQuestionnaire: React.FC<EQ5DQuestionnaireProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [responses, setResponses] = useState<Partial<EQ5DResponse>>({});
  const [vasScore, setVasScore] = useState(50);
  const [currentStep, setCurrentStep] = useState(0);

  const handleDimensionChange = (dimension: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [dimension]: parseInt(value),
    }));
  };

  const handleNext = () => {
    if (currentStep < dimensions.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const completeResponses: EQ5DResponse = {
      mobility: responses.mobility || 1,
      selfCare: responses.selfCare || 1,
      usualActivities: responses.usualActivities || 1,
      painDiscomfort: responses.painDiscomfort || 1,
      anxietyDepression: responses.anxietyDepression || 1,
      vasScore,
    };
    onComplete(completeResponses);
  };

  const isCurrentDimensionSelected = () => {
    if (currentStep >= dimensions.length) return true;
    const dimension = dimensions[currentStep];
    return responses[dimension.key as keyof EQ5DResponse] !== undefined;
  };

  const renderDimensionQuestion = (dimension: typeof dimensions[number]) => {
    const baseKey = `interview.warmup.${dimension.translationKey}`;
    
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl">{t(`${baseKey}.title`)}</CardTitle>
          {dimension.key === 'usualActivities' && (
            <CardDescription>{t(`${baseKey}.subtitle`)}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={responses[dimension.key as keyof EQ5DResponse]?.toString()}
            onValueChange={(value) => handleDimensionChange(dimension.key, value)}
            className="space-y-3"
          >
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50",
                  responses[dimension.key as keyof EQ5DResponse] === level && "border-primary bg-primary/5"
                )}
                onClick={() => handleDimensionChange(dimension.key, level.toString())}
              >
                <RadioGroupItem value={level.toString()} id={`${dimension.key}-${level}`} />
                <Label
                  htmlFor={`${dimension.key}-${level}`}
                  className="flex-1 cursor-pointer text-base"
                >
                  {t(`${baseKey}.level${level}`)}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    );
  };

  const renderVASQuestion = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">{t('interview.warmup.vas.title')}</CardTitle>
        <CardDescription>{t('interview.warmup.vas.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{t('interview.warmup.vas.worst')}</span>
          <span>{t('interview.warmup.vas.best')}</span>
        </div>
        <div className="px-2">
          <Slider
            value={[vasScore]}
            onValueChange={(value) => setVasScore(value[0])}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
        <div className="text-center">
          <span className="text-4xl font-bold text-primary">{vasScore}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </CardContent>
    </Card>
  );

  const totalSteps = dimensions.length + 1;
  const isLastStep = currentStep === dimensions.length;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">{t('interview.warmup.title')}</h2>
        <p className="text-muted-foreground mt-2">{t('interview.warmup.description')}</p>
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                index === currentStep
                  ? "bg-primary"
                  : index < currentStep
                  ? "bg-primary/50"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {currentStep < dimensions.length ? (
        renderDimensionQuestion(dimensions[currentStep])
      ) : (
        renderVASQuestion()
      )}

      <div className="flex justify-center gap-4 mt-8">
        {currentStep > 0 && (
          <Button variant="outline" onClick={handleBack}>
            {t('common.back')}
          </Button>
        )}
        {!isLastStep ? (
          <Button onClick={handleNext} disabled={!isCurrentDimensionSelected()}>
            {t('common.next')}
          </Button>
        ) : (
          <Button onClick={handleSubmit}>
            {t('common.submit')}
          </Button>
        )}
      </div>
    </div>
  );
};
