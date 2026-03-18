import { cn } from '@/utils/cn';

export function Skeleton({ className, ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse bg-forge-bg4/80', className)}
      {...props}
    />
  );
}
