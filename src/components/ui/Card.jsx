import { cn } from '@/utils/cn';

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('surface p-4', className)} {...props}>
      {children}
    </div>
  );
}
