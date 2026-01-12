import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  BellOff,
  X, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Target,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface PerformanceAlert {
  id: string;
  interviewer_id: string;
  alert_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function QualityNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (!user) return;

    fetchAlerts();

    // Subscribe to real-time alerts
    const channel = supabase
      .channel('performance-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'performance_alerts',
          filter: `interviewer_id=eq.${user.id}`,
        },
        (payload) => {
          const newAlert = payload.new as PerformanceAlert;
          setAlerts((prev) => [newAlert, ...prev]);
          
          // Show browser notification if enabled
          if (notificationsEnabled && Notification.permission === 'granted') {
            new Notification('Performance Update', {
              body: newAlert.message,
              icon: '/favicon.ico',
            });
          }

          // Show toast notification
          toast({
            title: getAlertTitle(newAlert.alert_type),
            description: newAlert.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, notificationsEnabled, toast]);

  useEffect(() => {
    // Check notification permission on mount
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const fetchAlerts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('performance_alerts')
      .select('*')
      .eq('interviewer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setAlerts(data);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        variant: 'destructive',
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser',
      });
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');

    if (permission === 'granted') {
      toast({
        title: 'Notifications Enabled',
        description: 'You will now receive push notifications for goal updates',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Notifications Blocked',
        description: 'Please enable notifications in your browser settings',
      });
    }
  };

  const markAsRead = async (alertId: string) => {
    const { error } = await supabase
      .from('performance_alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (!error) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('performance_alerts')
      .update({ is_read: true })
      .eq('interviewer_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    }
  };

  const clearAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('performance_alerts')
      .delete()
      .eq('id', alertId);

    if (!error) {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    }
  };

  const getAlertTitle = (type: string) => {
    switch (type) {
      case 'goal_achieved':
        return '🎉 Goal Achieved!';
      case 'goal_at_risk':
        return '⚠️ Goal At Risk';
      case 'goal_failed':
        return '❌ Goal Not Met';
      case 'progress_update':
        return '📊 Progress Update';
      case 'quality_update':
        return '✅ Quality Review';
      default:
        return '📢 Notification';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'goal_achieved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'goal_at_risk':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'goal_failed':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'progress_update':
        return <TrendingUp className="h-4 w-4 text-primary" />;
      case 'quality_update':
        return <Target className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {!notificationsEnabled ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={requestNotificationPermission}
                className="text-xs gap-1"
              >
                <BellOff className="h-3 w-3" />
                Enable
              </Button>
            ) : (
              <Badge variant="secondary" className="text-xs gap-1">
                <Bell className="h-3 w-3" />
                On
              </Badge>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[300px] sm:h-[400px]">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer group ${
                    !alert.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => !alert.is_read && markAsRead(alert.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getAlertIcon(alert.alert_type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(alert.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAlert(alert.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
