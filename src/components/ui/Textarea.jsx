import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-28 w-full border-b border-forge-border bg-transparent px-0 py-3 text-sm text-forge-text outline-none placeholder:text-forge-muted',
        'focus:border-forge-gold',
        className,
      )}
      {...props}
    />
  );
});
