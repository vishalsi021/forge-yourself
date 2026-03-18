import { useUiStore } from '@/stores/uiStore';

export function OfflineBanner() {
  const isOffline = useUiStore((state) => state.isOffline);

  if (!isOffline) return null;

  return (
    <div className="sticky top-0 z-40 border-b border-forge-red/20 bg-forge-red/10 px-4 py-2 text-center font-condensed text-[0.7rem] font-bold uppercase tracking-[0.18em] text-forge-red">
      Offline mode active - your actions will sync when connection returns.
    </div>
  );
}
