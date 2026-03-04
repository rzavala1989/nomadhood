import { NeighborhoodCard } from '@/components/neighborhood-card';
import { trpc } from '@/utils/trpc';

export function SimilarNeighborhoods({ neighborhoodId, state }: { neighborhoodId: string; state: string }) {
  const { data: similar } = trpc.neighborhoods.getSimilar.useQuery(
    { id: neighborhoodId, limit: 4 },
    { enabled: !!neighborhoodId },
  );

  if (!similar || similar.length === 0) return null;

  return (
    <div className="animate-fade-up" style={{ animationDelay: '360ms' }}>
      <p className="text-label text-[--text-ghost] mb-[var(--space-4)]">
        SIMILAR IN {state}
      </p>
      <div className="grid grid-cols-1 gap-px md:grid-cols-2">
        {similar.map((n, i) => (
          <div key={n.id} className="animate-fade-up" style={{ animationDelay: `${400 + i * 60}ms` }}>
            <NeighborhoodCard neighborhood={n} />
          </div>
        ))}
      </div>
    </div>
  );
}
