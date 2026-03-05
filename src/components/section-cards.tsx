import { trpc } from '@/utils/trpc';

export function SectionCards() {
  const { data: stats } = trpc.dashboard.getStats.useQuery();

  const chips = [
    { label: 'NEIGHBORHOODS', value: stats?.neighborhoodCount },
    { label: 'USERS', value: stats?.userCount },
    { label: 'REVIEWS', value: stats?.reviewCount },
    { label: 'FAVORITES', value: stats?.favoriteCount },
  ];

  return (
    <div className="flex items-center h-[56px] px-[var(--space-6)] animate-fade-up">
      {chips.map((chip, i) => (
        <div key={chip.label} className="flex items-center flex-1 min-w-0">
          {i > 0 && (
            <div className="w-px h-8 bg-[--border-default] shrink-0" />
          )}
          <div className={`flex-1 ${i > 0 ? 'pl-[var(--space-4)]' : ''} ${i < chips.length - 1 ? 'pr-[var(--space-4)]' : ''}`}>
            <p className="text-[9px] uppercase tracking-[0.18em] text-[--text-ghost] leading-none">
              {chip.label}
            </p>
            <p className="text-[28px] font-medium text-[--text-primary] tabular-nums leading-none mt-[2px]">
              {chip.value ?? '\u2014'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
