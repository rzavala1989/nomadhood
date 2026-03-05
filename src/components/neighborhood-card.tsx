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
  imageUrl,
  imageAlt,
  imageSource,
}: {
  neighborhood: NeighborhoodCardProps;
  nomadScore?: number;
  imageUrl?: string;
  imageAlt?: string;
  imageSource?: string;
}) {
  const { add, remove, has, isFull } = useComparison();
  const isComparing = has(neighborhood.id);

  return (
    <Link href={`/neighborhoods/${neighborhood.id}`} className="block">
      <div className="surface-1 surface-hover glow-hover relative aspect-square flex flex-col">
        {/* Thumbnail */}
        {imageUrl && (
          <div className="relative flex-1 min-h-0 overflow-hidden group/img">
            <img
              src={imageUrl}
              alt={imageAlt ?? `${neighborhood.name} neighborhood`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent from-70% to-[rgba(248,246,252,0.8)]" />
            {/* Source label on hover */}
            {imageSource && (
              <span className="absolute bottom-[var(--space-2)] left-[var(--space-2)] text-[8px] tracking-[0.12em] uppercase text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                {imageSource}
              </span>
            )}
          </div>
        )}

        {/* Content pinned to bottom */}
        <div className={`p-[var(--space-4)] ${imageUrl ? '' : 'flex-1 flex flex-col justify-end'}`}>
          {/* Nomad Score badge */}
          {nomadScore != null && nomadScore > 0 && (
            <div className="absolute top-[var(--space-3)] right-[var(--space-3)] bg-vapor text-white px-[var(--space-2)] py-[2px] text-[9px] tracking-[0.1em] tabular-nums">
              {nomadScore}
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-heading font-light text-[--text-primary] truncate">
                {neighborhood.name}
              </p>
              <p className="mt-[var(--space-1)] text-caption text-[--text-tertiary]">
                {neighborhood.city}, {neighborhood.state}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
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
                    ? 'text-[--vapor-purple]'
                    : 'text-[--text-ghost] disabled:opacity-30'
                }`}
                title={isComparing ? 'Remove from comparison' : 'Add to comparison'}
              >
                <GitCompareArrowsIcon className="h-3.5 w-3.5" />
              </button>
              <FavoriteButton neighborhoodId={neighborhood.id} />
            </div>
          </div>

          {neighborhood.description && (
            <p className="mt-[var(--space-2)] text-body text-[--text-secondary] line-clamp-2">
              {neighborhood.description}
            </p>
          )}

          <div className="mt-[var(--space-3)] flex items-center justify-between pt-[var(--space-3)] shadow-[inset_0_1px_0_var(--border-default)]">
            <div className="flex items-center gap-[var(--space-1)]">
              <StarIcon className="h-3 w-3 fill-[--vapor-pink] text-[--vapor-pink]" />
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
      </div>
    </Link>
  );
}
