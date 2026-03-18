import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

export function TaskItem({ task, onToggle }) {
  const tagVariant = task.isCustom ? 'purple' : task.isCore ? 'gold' : 'blue';
  const tagLabel = task.isCustom ? 'Custom' : task.isCore ? 'Elite' : task.area;

  return (
    <button
      type="button"
      className={cn(
        'surface w-full p-4 text-left transition hover:border-forge-gold/30 focus:outline-none focus-visible:border-forge-gold focus-visible:ring-1 focus-visible:ring-forge-gold/40',
        task.done && 'opacity-50',
      )}
      onClick={() => onToggle(task.id)}
    >
      <div className="flex items-start gap-3">
        <div className={cn('mt-1 flex h-5 w-5 items-center justify-center border', task.done ? 'border-forge-green bg-forge-green text-black' : 'border-forge-border')}>
          {task.done ? '✓' : ''}
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn('text-sm text-forge-text', task.done && 'line-through')}>
            {task.emoji ? `${task.emoji} ` : ''}
            {task.text}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={tagVariant}>{tagLabel}</Badge>
            <span className="font-display text-lg text-forge-gold">+{task.xp}</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-forge-muted2">{task.why}</p>
        </div>
      </div>
    </button>
  );
}
