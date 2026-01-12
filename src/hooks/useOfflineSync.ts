import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
}

const STORAGE_KEY = 'offline_pending_actions';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Load pending actions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPendingActions(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse pending actions:', e);
      }
    }
  }, []);

  // Save pending actions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingActions));
  }, [pendingActions]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back online",
        description: "Your connection has been restored. Syncing pending data...",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline",
        description: "Don't worry - your work will be saved locally and synced when you're back online.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Queue an action for sync
  const queueAction = useCallback((action: Omit<PendingAction, 'id' | 'timestamp'>) => {
    const newAction: PendingAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setPendingActions(prev => [...prev, newAction]);
    return newAction.id;
  }, []);

  // Remove a completed action
  const removeAction = useCallback((actionId: string) => {
    setPendingActions(prev => prev.filter(a => a.id !== actionId));
  }, []);

  // Clear all pending actions
  const clearActions = useCallback(() => {
    setPendingActions([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get pending action count
  const pendingCount = pendingActions.length;

  return {
    isOnline,
    isSyncing,
    pendingActions,
    pendingCount,
    queueAction,
    removeAction,
    clearActions,
    setIsSyncing,
  };
}
