import Link from 'next/link';
import { StarIcon, GitCompareArrowsIcon } from 'lucide-react';

import { FavoriteButton } from '@/components/favorite-button';
import { useComparison } from '@/contexts/comparison-context';

type NeighborhoodCardProps = {
  id: string;
  name: string;
  city: string;
  state: string;
  description: string | null;
  _count: {
    reviews: number;
    favorites: number;
  };
};

export function NeighborhoodCard({
  neighborhood,
  nomadScore,
}: {
  neighborhood: NeighborhoodCardProps;
  nomadScore?: number;
}) {
  const { add, remove, has, isFull } = useComparison();
  const isComparing = has(neighborhood.id);

  return (
    <Link href={`/neighborhoods/${neighborhood.id}`} className="block">
      <div className="surface-1 surface-hover p-[var(--space-5)] relative">
        {/* Nomad Score badge */}
        {nomadScore != null && nomadScore > 0 && (
          <div className="absolute top-[var(--space-3)] right-[var(--space-3)] bg-[--bg-inverse] text-[--text-inverse] px-[var(--space-2)] py-[2px] text-[9px] tracking-[0.1em] tabular-nums">
            {nomadScore}
          </div>
        )}

        <div className="flex items-start justify-between">
          <div>
            <p className="text-heading font-light text-[--text-primary]">
              {neighborhood.name}
            </p>
            <p className="mt-[var(--space-1)] text-caption text-[--text-tertiary]">
              {neighborhood.city}, {neighborhood.state}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isComparing) {
                  remove(neighborhood.id);
                } else if (!isFull) {
                  add({ id: neighborhood.id, name: neighborhood.name });
                }
              }}
              disabled={!isComparing && isFull}
              className={`p-1 transition-all hover:scale-110 ${
                isComparing
                  ? 'text-[--text-primary]'
                  : 'text-black/[0.12] disabled:opacity-30'
              }`}
              title={isComparing ? 'Remove from comparison' : 'Add to comparison'}
            >
              <GitCompareArrowsIcon className="h-3.5 w-3.5" />
            </button>
            <FavoriteButton neighborhoodId={neighborhood.id} />
          </div>
        </div>

        {neighborhood.description && (
          <p className="mt-[var(--space-3)] text-body text-[--text-secondary] line-clamp-2">
            {neighborhood.description}
          </p>
        )}

        <div className="mt-[var(--space-4)] flex items-center justify-between border-t border-black/[0.06] pt-[var(--space-3)]">
          <div className="flex items-center gap-[var(--space-1)]">
            <StarIcon className="h-3 w-3 fill-black/70 text-black/70" />
            <span className="text-caption text-[--text-secondary] tabular-nums">
              {neighborhood._count.reviews}
            </span>
            <span className="text-micro text-[--text-ghost]">REVIEWS</span>
          </div>
          <span className="text-micro text-[--text-ghost]">
            {neighborhood._count.favorites} SAVED
          </span>
        </div>
      </div>
    </Link>
  );
}
