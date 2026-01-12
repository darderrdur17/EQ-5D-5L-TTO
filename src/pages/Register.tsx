import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Activity, Eye, EyeOff, Loader2, Shield, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { cn } from '@/lib/utils';

export default function Register() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('interviewer');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, isAuthenticated, role: userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && userRole) {
      navigate(userRole === 'admin' ? '/admin' : '/dashboard');
    }
  }, [isAuthenticated, userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Please fill in all required fields.',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Passwords do not match.',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Password must be at least 8 characters long.',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const result = await register(name, email, password, role);
    
    if (result.success) {
      toast({
        title: t('common.success'),
        description: 'Account created successfully!',
      });
    } else {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: result.error || 'Something went wrong.',
      });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      {/* Language switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Link to="/" className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Activity className="h-6 w-6" />
        </div>
        <span className="font-display text-xl font-bold text-foreground">EQ-5D-5L TTO</span>
      </Link>

      <Card className="w-full max-w-md shadow-elevated animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">{t('auth.createAccount')}</CardTitle>
          <CardDescription>
            Join the EQ-5D-5L TTO Survey platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('auth.fullName')}</Label>
              <Input
                id="name"
                type="text"
                placeholder="Dr. Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isSubmitting}
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <Label>{t('auth.role')}</Label>
              <RadioGroup
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="interviewer"
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all",
                    role === 'interviewer' 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value="interviewer" id="interviewer" className="sr-only" />
                  <ClipboardList className={cn(
                    "h-8 w-8 mb-2",
                    role === 'interviewer' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "font-medium",
                    role === 'interviewer' ? "text-primary" : "text-foreground"
                  )}>{t('auth.interviewer')}</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Conduct TTO surveys
                  </span>
                </Label>

                <Label
                  htmlFor="admin"
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all",
                    role === 'admin' 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value="admin" id="admin" className="sr-only" />
                  <Shield className={cn(
                    "h-8 w-8 mb-2",
                    role === 'admin' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "font-medium",
                    role === 'admin' ? "text-primary" : "text-foreground"
                  )}>{t('auth.admin')}</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Manage system & users
                  </span>
                </Label>
              </RadioGroup>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('auth.registering')}
                </>
              ) : (
                t('auth.register')
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              {t('auth.login')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
