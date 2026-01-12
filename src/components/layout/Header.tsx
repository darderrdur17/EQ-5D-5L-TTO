import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { QualityNotifications } from '@/components/notifications/QualityNotifications';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  LogOut, 
  User, 
  Settings, 
  Menu, 
  X,
  LayoutDashboard,
  ClipboardList,
  Activity,
  BookOpen,
  Download
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Header() {
  const { t } = useTranslation();
  const { profile, role, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = isAuthenticated ? [
    { 
      path: role === 'admin' ? '/admin' : '/dashboard', 
      label: t('nav.dashboard'), 
      icon: LayoutDashboard 
    },
    ...(role === 'interviewer' ? [
      { path: '/interview', label: t('nav.interview'), icon: ClipboardList },
    ] : []),
    { path: '/guide', label: 'Guide', icon: BookOpen },
  ] : [
    { path: '/install', label: 'Install App', icon: Download },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link 
          to={isAuthenticated ? (role === 'admin' ? '/admin' : '/dashboard') : '/'} 
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <span className="font-display text-lg font-bold text-foreground">EQ-5D-5L</span>
            <span className="ml-1 text-sm text-muted-foreground">TTO Survey</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path}>
              <Button
                variant={isActive(link.path) ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  "gap-2",
                  isActive(link.path) && "bg-accent text-accent-foreground"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <OfflineIndicator />
          <LanguageSwitcher />
          
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <QualityNotifications />
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="hidden sm:inline-block text-sm font-medium">
                      {profile?.full_name || profile?.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{profile?.full_name || 'User'}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {profile?.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2">
                    <span className="inline-flex h-5 items-center rounded-full bg-primary/10 px-2 text-xs font-medium text-primary capitalize">
                      {role}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2">
                    <Settings className="h-4 w-4" />
                    {t('common.settings') || 'Settings'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="gap-2 text-destructive focus:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    {t('auth.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">{t('auth.login')}</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">{t('landing.hero.cta')}</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && isAuthenticated && (
        <div className="border-t border-border md:hidden">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button
                  variant={isActive(link.path) ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-2"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
