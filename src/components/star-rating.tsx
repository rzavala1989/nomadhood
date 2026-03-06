import { StarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            'p-0.5',
            !readonly && 'cursor-pointer hover:scale-110 transition-transform',
            readonly && 'cursor-default',
          )}
        >
          <StarIcon
            className={cn(
              'h-4 w-4',
              star <= value
                ? 'fill-[--accent-rose] text-[--accent-rose]'
                : 'text-[rgba(38,38,38,0.15)]',
            )}
          />
        </button>
      ))}
    </div>
  );
}
