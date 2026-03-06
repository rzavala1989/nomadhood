import { NeighborhoodCard } from '@/components/neighborhood-card';
import { trpc } from '@/utils/trpc';

export function SimilarNeighborhoods({ neighborhoodId, state }: { neighborhoodId: string; state: string }) {
  const { data: similar } = trpc.neighborhoods.getSimilar.useQuery(
    { id: neighborhoodId, limit: 4 },
    { enabled: !!neighborhoodId },
  );

  const neighborhoodIds = similar?.map((n) => n.id) ?? [];
  const { data: imageMap } = trpc.data.getImages.useQuery(
    { neighborhoodIds },
    { enabled: neighborhoodIds.length > 0 },
  );

  if (!similar || similar.length === 0) return null;

  return (
    <div className="animate-reveal" style={{ animationDelay: '360ms' }}>
      <p className="text-label text-[--text-ghost] mb-[var(--space-4)]">
        SIMILAR IN {state}
      </p>
      <div className="grid grid-cols-1 gap-x-6 gap-y-0 md:grid-cols-2">
        {similar.map((n, i) => (
          <div key={n.id} className={`animate-reveal mb-8 ${i % 2 === 1 ? 'md:mt-[60px]' : ''}`} style={{ animationDelay: `${400 + i * 60}ms` }}>
            <NeighborhoodCard
              neighborhood={n}
              imageUrl={imageMap?.[n.id]?.[0]?.thumbUrl ?? imageMap?.[n.id]?.[0]?.imageUrl}
              imageAlt={imageMap?.[n.id]?.[0]?.altText ?? undefined}
              imageSource={imageMap?.[n.id]?.[0]?.source}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
