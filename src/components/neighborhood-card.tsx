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
    <Link href={`/neighborhoods/${neighborhood.id}`} className="block group">
      <div className="relative">
        {/* Image */}
        {imageUrl && (
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg mb-4">
            <img
              src={imageUrl}
              alt={imageAlt ?? `${neighborhood.name} neighborhood`}
              loading="lazy"
              className="h-full w-full object-cover img-hover"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="h-24 w-24 rounded-full bg-[--accent-charcoal] flex items-center justify-center">
                <span className="text-label text-[--text-inverse] tracking-[0.3em]">VIEW</span>
              </div>
            </div>
            {/* Source attribution */}
            {imageSource && (
              <span className="absolute bottom-3 left-3 text-[9px] tracking-widest uppercase text-white/70 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                {imageSource}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
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
            className={`p-2 rounded-full backdrop-blur-sm transition-all ${
              isComparing
                ? 'bg-[--accent-rose] text-[--accent-charcoal]'
                : 'bg-white/60 text-[--text-tertiary] hover:bg-white/80 disabled:opacity-30'
            }`}
            title={isComparing ? 'Remove from comparison' : 'Add to comparison'}
          >
            <GitCompareArrowsIcon className="h-3.5 w-3.5" />
          </button>
          <FavoriteButton neighborhoodId={neighborhood.id} />
        </div>

        {/* Score badge */}
        {nomadScore != null && nomadScore > 0 && (
          <div className="absolute top-3 left-3 badge-accent px-3 py-1 z-10">
            {nomadScore}
          </div>
        )}

        {/* Content */}
        <div>
          <p className="text-label text-[--accent-rose] mb-2">
            {neighborhood.city}, {neighborhood.state}
          </p>
          <p className="text-heading text-[--text-primary] mb-2">
            {neighborhood.name}
          </p>

          {neighborhood.description && (
            <p className="text-body text-[--text-secondary] line-clamp-2 mb-3">
              {neighborhood.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-micro text-[--text-ghost]">
            <span className="flex items-center gap-1">
              <StarIcon className="h-3 w-3 fill-[--accent-rose] text-[--accent-rose]" />
              {neighborhood._count.reviews} review{neighborhood._count.reviews !== 1 ? 's' : ''}
            </span>
            <span>{neighborhood._count.favorites} saved</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
