import { useEffect } from 'react';

import { flushMutationQueue } from '@/lib/offlineQueue';
import { useUiStore } from '@/stores/uiStore';

export function useOnlineStatus() {
  const setOffline = useUiStore((state) => state.setOffline);

  useEffect(() => {
    const sync = async () => {
      const offline = !navigator.onLine;
      setOffline(offline);
      if (!offline) {
        await flushMutationQueue().catch(() => null);
      }
    };

    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);

    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, [setOffline]);
}
