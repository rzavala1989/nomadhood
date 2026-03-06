import { trpc } from '@/utils/trpc';
import { useReveal } from '@/hooks/useReveal';

export function SectionCards() {
  const { data: stats } = trpc.dashboard.getStats.useQuery();
  const { ref, isVisible } = useReveal();

  const chips = [
    { label: 'Neighborhoods', value: stats?.neighborhoodCount },
    { label: 'Users', value: stats?.userCount },
    { label: 'Reviews', value: stats?.reviewCount },
    { label: 'Favorites', value: stats?.favoriteCount },
  ];

  return (
    <div
      ref={ref}
      className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${
        isVisible ? 'animate-reveal' : 'opacity-0'
      }`}
    >
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="surface-card p-8 group cursor-default"
        >
          <p className="text-label text-[--text-ghost] group-hover:text-[--accent-charcoal] mb-3 transition-colors">
            {chip.label}
          </p>
          <p className="text-display tabular-nums text-[--text-primary] group-hover:text-[--accent-charcoal] transition-colors">
            {chip.value ?? '\u2014'}
          </p>
        </div>
      ))}
    </div>
  );
}
