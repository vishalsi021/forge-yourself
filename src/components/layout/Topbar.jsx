import { Skeleton } from '@/components/ui/Skeleton';

import { Bell, Flame, Star } from './Topbar.icons';

export function Topbar({ day = 1, streak = 0, xp = 0, unread = 0, loading = false }) {
  return (
    <header className="sticky top-0 z-30 border-b border-forge-border bg-forge-bg/95 backdrop-blur-xl">
      <div className="app-shell flex items-center justify-between px-4 py-3">
        <div>
          <div className="font-display text-3xl tracking-[0.22em] text-forge-text">FORGE</div>
        </div>
        {loading ? <TopbarLoadingState /> : (
          <div className="flex items-center gap-2">
            <Pill icon={<Star className="h-3 w-3" />} tone="gold">{xp} XP</Pill>
            <Pill icon={<Flame className="h-3 w-3" />} tone="orange">{streak}</Pill>
            <Pill tone="blue">Day {day}</Pill>
            <div className="relative border border-forge-border bg-forge-bg3 p-2 text-forge-muted2">
              <Bell className="h-4 w-4" />
              {unread ? <span className="absolute -right-1 -top-1 h-2.5 w-2.5 bg-forge-red" /> : null}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function TopbarLoadingState() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-14" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-10 w-10" />
    </div>
  );
}

function Pill({ children, icon, tone }) {
  const tones = {
    gold: 'border-forge-gold/20 bg-forge-gold/10 text-forge-gold',
    orange: 'border-forge-orange/20 bg-forge-orange/10 text-forge-orange',
    blue: 'border-forge-blue/20 bg-forge-blue/10 text-forge-blue',
  };

  return (
    <span className={`inline-flex items-center gap-1 border px-2 py-1 font-condensed text-[0.65rem] font-bold uppercase tracking-[0.2em] ${tones[tone]}`}>
      {icon}
      {children}
    </span>
  );
}
