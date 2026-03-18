import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

const variants = {
  primary: 'bg-forge-gold text-black hover:bg-white',
  secondary: 'border border-forge-border bg-forge-bg3 text-forge-text hover:border-forge-gold hover:text-forge-gold',
  ghost: 'text-forge-muted2 hover:text-forge-text',
  danger: 'bg-forge-red text-white hover:opacity-90',
};

export const Button = forwardRef(function Button({ className, variant = 'primary', ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        'font-condensed text-sm font-bold uppercase tracking-[0.22em] transition disabled:cursor-not-allowed disabled:opacity-40',
        'px-4 py-3',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
