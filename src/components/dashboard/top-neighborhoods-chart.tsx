import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';

export function TopNeighborhoodsChart() {
  const { data: neighborhoods, isLoading } =
    trpc.dashboard.getTopNeighborhoods.useQuery({ limit: 8 });

  if (isLoading) {
    return (
      <div className="space-y-[6px]">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[32px] w-full" />
        ))}
      </div>
    );
  }

  if (!neighborhoods || neighborhoods.length === 0) {
    return (
      <p className="text-body text-[--text-tertiary] py-[var(--space-4)]">
        Not enough data yet.
      </p>
    );
  }

  return (
    <div>
      {neighborhoods.map((n, i) => (
        <Link
          key={n.id}
          href={`/neighborhoods/${n.id}`}
          className="flex items-center gap-[var(--space-3)] py-[6px] px-[var(--space-2)] hover:bg-[--bg-secondary] transition-colors group"
          style={i === 0 ? { boxShadow: 'inset 3px 0 0 var(--accent-rose)' } : undefined}
        >
          <span className="text-micro text-[--text-ghost] tabular-nums w-[16px] shrink-0 text-right">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <span className="text-caption text-[--text-secondary] group-hover:text-[--text-primary] transition-colors truncate block">
              {n.name}
            </span>
          </div>
          <span className="text-micro text-[--text-ghost] shrink-0">
            {n.city}
          </span>
          <span className="text-caption text-[--text-secondary] tabular-nums shrink-0">
            {n.avgRating.toFixed(1)}
          </span>
          <span className="text-micro text-[--text-ghost] tabular-nums shrink-0">
            ({n.reviewCount})
          </span>
        </Link>
      ))}
    </div>
  );
}
