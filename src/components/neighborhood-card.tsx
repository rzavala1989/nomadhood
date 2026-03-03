import Link from 'next/link';
import { StarIcon } from 'lucide-react';

import { FavoriteButton } from '@/components/favorite-button';

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
}: {
  neighborhood: NeighborhoodCardProps;
}) {
  return (
    <Link href={`/neighborhoods/${neighborhood.id}`} className="block">
      <div className="surface-1 surface-hover p-[var(--space-5)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-heading font-light text-[--text-primary]">
              {neighborhood.name}
            </p>
            <p className="mt-[var(--space-1)] text-caption text-[--text-tertiary]">
              {neighborhood.city}, {neighborhood.state}
            </p>
          </div>
          <FavoriteButton neighborhoodId={neighborhood.id} />
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
