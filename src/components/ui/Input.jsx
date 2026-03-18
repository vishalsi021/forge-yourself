import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full border-b border-forge-border bg-transparent px-0 py-3 text-sm text-forge-text outline-none placeholder:text-forge-muted',
        'focus:border-forge-gold',
        className,
      )}
      {...props}
    />
  );
});
