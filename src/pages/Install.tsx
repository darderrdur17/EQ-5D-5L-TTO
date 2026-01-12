import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Share,
  MoreVertical,
  Plus,
  Monitor,
  Tablet
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsStandalone(isStandaloneMode);
      setIsInstalled(isStandaloneMode);
    };
    
    checkInstalled();

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 px-4 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Download className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Install TTO Survey
          </h1>
          <p className="text-muted-foreground">
            Install the app for offline access and a native experience
          </p>
        </div>

        {isInstalled || isStandalone ? (
          <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                <div>
                  <h3 className="font-semibold text-lg text-emerald-800 dark:text-emerald-200">
                    App Installed!
                  </h3>
                  <p className="text-emerald-700 dark:text-emerald-300 text-sm mt-1">
                    You're using the installed version of TTO Survey
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Install Button for supported browsers */}
            {deferredPrompt && (
              <Card className="border-primary/50">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4">
                    <Button size="lg" onClick={handleInstall} className="gap-2 w-full sm:w-auto">
                      <Download className="h-5 w-5" />
                      Install App Now
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      Click to add TTO Survey to your home screen
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* iOS Instructions */}
            {isIOS && !deferredPrompt && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Install on iOS
                  </CardTitle>
                  <CardDescription>
                    Follow these steps to install on iPhone or iPad
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Tap the Share button</p>
                      <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                        <Share className="h-5 w-5" />
                        <span className="text-sm">in Safari's toolbar</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Scroll and tap "Add to Home Screen"</p>
                      <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                        <Plus className="h-5 w-5" />
                        <span className="text-sm">from the share menu</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Tap "Add" to confirm</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        The app will appear on your home screen
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Android/Chrome Instructions */}
            {!isIOS && !deferredPrompt && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Install on Android / Chrome
                  </CardTitle>
                  <CardDescription>
                    Follow these steps to install
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Tap the menu button</p>
                      <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                        <MoreVertical className="h-5 w-5" />
                        <span className="text-sm">three dots in Chrome</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Tap "Install app" or "Add to Home screen"</p>
                      <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                        <Download className="h-5 w-5" />
                        <span className="text-sm">from the menu</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Confirm the installation</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        The app will be installed and added to your apps
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Why Install?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <WifiOff className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Works Offline</p>
                      <p className="text-xs text-muted-foreground">
                        Conduct interviews without internet
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Native Experience</p>
                      <p className="text-xs text-muted-foreground">
                        Full-screen, app-like interface
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Download className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Quick Access</p>
                      <p className="text-xs text-muted-foreground">
                        Launch instantly from home screen
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Wifi className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Auto-Sync</p>
                      <p className="text-xs text-muted-foreground">
                        Data syncs when back online
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Device Support */}
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="gap-1.5">
                <Smartphone className="h-3 w-3" />
                iPhone
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <Smartphone className="h-3 w-3" />
                Android
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <Tablet className="h-3 w-3" />
                iPad
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <Monitor className="h-3 w-3" />
                Desktop
              </Badge>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
