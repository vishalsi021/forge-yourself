import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';

const variants = {
  default: 'border-forge-border bg-forge-bg3 text-forge-text',
  success: 'border-forge-green/20 bg-forge-green/10 text-forge-green',
  error: 'border-forge-red/20 bg-forge-red/10 text-forge-red',
};

export function ToastStack() {
  const toasts = useUiStore((state) => state.toasts);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 mx-auto flex w-full max-w-app flex-col gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'border px-4 py-3 text-sm font-medium shadow-levelup transition-opacity duration-200',
            variants[toast.variant || 'default'],
          )}
        >
          {toast.title}
        </div>
      ))}
    </div>
  );
}
