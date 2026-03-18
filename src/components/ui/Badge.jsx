import { cn } from '@/utils/cn';

const variants = {
  gold: 'border border-forge-gold/30 bg-forge-gold/10 text-forge-gold',
  green: 'border border-forge-green/20 bg-forge-green/10 text-forge-green',
  red: 'border border-forge-red/20 bg-forge-red/10 text-forge-red',
  blue: 'border border-forge-blue/20 bg-forge-blue/10 text-forge-blue',
  purple: 'border border-forge-purple/20 bg-forge-purple/10 text-forge-purple',
  orange: 'border border-forge-orange/20 bg-forge-orange/10 text-forge-orange',
};

export function Badge({ className, variant = 'gold', children }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-1 font-condensed text-[0.65rem] font-bold uppercase tracking-[0.2em]', variants[variant], className)}>
      {children}
    </span>
  );
}
