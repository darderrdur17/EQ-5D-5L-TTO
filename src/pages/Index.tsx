import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Activity, 
  Shield, 
  Globe, 
  BarChart3, 
  Users, 
  CheckCircle2,
  ArrowRight,
  Zap,
  Lock,
  Smartphone
} from 'lucide-react';

const FEATURES = [
  {
    icon: Activity,
    title: 'Interactive TTO Tasks',
    description: 'Visual decision aids with intuitive slider controls for accurate health state valuations',
  },
  {
    icon: Globe,
    title: 'Multi-Language Support',
    description: 'Conduct interviews in English, Spanish, Chinese, Bahasa Indonesia, and Malay',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Monitor quota progress, data quality, and interviewer performance at a glance',
  },
  {
    icon: Shield,
    title: 'GDPR Compliant',
    description: 'Privacy-by-design with data encryption, pseudonymization, and audit trails',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    description: 'Separate dashboards and permissions for administrators and interviewers',
  },
  {
    icon: Zap,
    title: 'AI Interview Co-pilot',
    description: 'Real-time protocol guidance and automatic data quality monitoring',
  },
];

const BENEFITS = [
  'Complete EQ-VT protocol implementation',
  'Worse-than-death handling with lead-time TTO',
  'Automatic data quality checks',
  'Cross-platform responsive design',
  'Accessibility WCAG 2.1 compliant',
  'Secure session management',
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-lg font-bold text-foreground">EQ-5D-5L</span>
              <span className="ml-1 text-sm text-muted-foreground">TTO Survey</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-3xl" />
        </div>

        <div className="container py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Zap className="h-4 w-4" />
              Production-Ready Research Tool
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight text-balance">
              EQ-5D-5L Time Trade-Off{' '}
              <span className="text-primary">Survey Platform</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              A comprehensive web application for conducting standardized health valuation studies. 
              Built for researchers, optimized for respondents.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button variant="hero" size="xl" className="gap-2">
                  Start Interview Session
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="xl">
                  Sign in to Dashboard
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-success" />
                <span>256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-success" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-success" />
                <span>Cross-Platform</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything you need for TTO research
            </h2>
            <p className="text-lg text-muted-foreground">
              Built following EQ-VT Protocol v2.0 with modern web technologies
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="card-hover border-2">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Built for health economics research
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our platform implements the complete Classic TTO protocol with all the features 
                researchers need to conduct rigorous health state valuation studies.
              </p>
              <ul className="space-y-4">
                {BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Demo preview card */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-2">
              <div className="aspect-video rounded-lg bg-card shadow-lg overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive/60" />
                  <div className="h-3 w-3 rounded-full bg-warning/60" />
                  <div className="h-3 w-3 rounded-full bg-success/60" />
                </div>
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-12 bg-primary/10 rounded-lg" />
                  <div className="h-12 bg-secondary/20 rounded-lg w-4/5" />
                  <div className="flex gap-3 pt-4">
                    <div className="h-10 bg-muted rounded-lg flex-1" />
                    <div className="h-10 bg-primary rounded-lg w-24" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Interactive TTO visualization with real-time feedback
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Ready to start your research?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Create an account and start conducting TTO interviews today. 
            Our platform is designed to make health valuation research efficient and reliable.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button variant="hero-outline" size="xl" className="gap-2">
                Create Free Account
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Activity className="h-4 w-4" />
              </div>
              <span className="font-display font-semibold text-foreground">EQ-5D-5L TTO Survey</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 EQ-5D-5L TTO Survey. Built for health economics research.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
