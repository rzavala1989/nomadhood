import { trpc } from '@/utils/trpc';

export function SectionCards() {
  const { data: stats } = trpc.dashboard.getStats.useQuery();

  const cards = [
    { label: 'Neighborhoods', value: stats?.neighborhoodCount, desc: 'Total listed' },
    { label: 'Users', value: stats?.userCount, desc: 'Registered' },
    { label: 'Reviews', value: stats?.reviewCount, desc: 'Submitted' },
    { label: 'Favorites', value: stats?.favoriteCount, desc: 'Saved' },
  ];

  return (
    <div className="grid grid-cols-1 gap-px px-[var(--space-6)] @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className="surface-1 p-[var(--space-5)] animate-fade-up"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <p className="text-label text-[--text-ghost]">{card.label}</p>
          <p className="mt-[var(--space-2)] text-[28px] font-light text-[--text-primary] tabular-nums">
            {card.value ?? '\u2014'}
          </p>
          <p className="mt-[var(--space-1)] text-micro text-[--text-tertiary]">
            {card.desc}
          </p>
        </div>
      ))}
    </div>
  );
}
