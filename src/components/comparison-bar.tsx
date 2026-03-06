import { useRouter } from 'next/router';
import { XIcon, ArrowRightIcon } from 'lucide-react';

import { useComparison } from '@/contexts/comparison-context';

export function ComparisonBar() {
  const { items, remove, clear } = useComparison();
  const router = useRouter();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[--bg-inverse] text-[--text-inverse] animate-reveal">
      <div className="flex items-center justify-between px-[var(--space-6)] py-[var(--space-3)]">
        <div className="flex items-center gap-[var(--space-4)]">
          <span className="text-micro tracking-[0.18em]">
            COMPARE ({items.length}/3)
          </span>
          <div className="flex gap-[var(--space-2)]">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => remove(item.id)}
                className="flex items-center gap-1 bg-white/10 px-[var(--space-3)] py-[var(--space-1)] text-caption transition-colors hover:bg-white/20"
              >
                {item.name}
                <XIcon className="h-3 w-3 opacity-50" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-[var(--space-3)]">
          <button
            onClick={clear}
            className="text-micro tracking-[0.18em] opacity-50 hover:opacity-100 transition-opacity"
          >
            CLEAR
          </button>
          {items.length >= 2 && (
            <button
              onClick={() => {
                const ids = items.map((i) => i.id).join(',');
                router.push(`/compare?ids=${ids}`);
              }}
              className="flex items-center gap-1 bg-white/20 px-[var(--space-4)] py-[var(--space-2)] text-[9px] uppercase tracking-[0.18em] transition-colors hover:bg-white/30"
            >
              Compare
              <ArrowRightIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
