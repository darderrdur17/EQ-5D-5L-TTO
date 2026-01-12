import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Globe, ArrowRight, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PublicSurvey() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [respondentCode, setRespondentCode] = useState(searchParams.get('code') || '');
  const [language, setLanguage] = useState(searchParams.get('lang') || 'en');
  const [error, setError] = useState('');

  useEffect(() => {
    // Set language from URL param
    const langParam = searchParams.get('lang');
    if (langParam && ['en', 'ms', 'zh', 'id', 'es'].includes(langParam)) {
      i18n.changeLanguage(langParam);
      setLanguage(langParam);
    }
  }, [searchParams, i18n]);

  const handleStartSurvey = () => {
    if (!respondentCode.trim()) {
      setError('Please enter a respondent code to continue');
      return;
    }
    
    // Redirect to interview page with the code
    // Note: This would need an interviewer to be logged in to create a session
    // For now, show a message that they need to contact the interviewer
    setError('Please contact your interviewer to start the session. Share your code: ' + respondentCode);
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <ClipboardList className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">EQ-5D-5L TTO Survey</CardTitle>
          <CardDescription>
            Welcome to the health valuation survey. Please enter your respondent code to begin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="language" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Select Language
            </Label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ms">Bahasa Melayu</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="id">Bahasa Indonesia</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="respondent-code">Respondent Code</Label>
            <Input
              id="respondent-code"
              placeholder="Enter your code (e.g., R001)"
              value={respondentCode}
              onChange={(e) => {
                setRespondentCode(e.target.value);
                setError('');
              }}
            />
            <p className="text-xs text-muted-foreground">
              This code was provided by your interviewer
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={handleStartSurvey}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <p className="text-center text-xs text-muted-foreground">
              By continuing, you consent to participate in this health valuation study.
              Your responses will be kept confidential.
            </p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-center text-sm text-muted-foreground">
              Are you an interviewer?{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/login')}>
                Login here
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
