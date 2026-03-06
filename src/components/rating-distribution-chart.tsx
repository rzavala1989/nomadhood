import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';

export function RatingDistributionChart({
  neighborhoodId,
}: {
  neighborhoodId: string;
}) {
  const { data: stats, isLoading } = trpc.reviews.getStats.useQuery({
    neighborhoodId,
  });

  if (isLoading) {
    return <Skeleton className="h-[140px] w-full" />;
  }

  if (!stats || stats.totalReviews === 0) {
    return null;
  }

  const rows = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: stats.ratingDistribution[star as keyof typeof stats.ratingDistribution],
  }));

  const maxCount = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div>
      <div className="space-y-[6px]">
        {rows.map((row) => {
          const widthPct = (row.count / maxCount) * 100;
          const isDominant = row.count === maxCount && row.count > 0;

          return (
            <div key={row.star} className="flex items-center gap-[var(--space-2)]">
              <span className="text-micro text-[--text-tertiary] tabular-nums w-[20px] text-right shrink-0">
                {row.star}★
              </span>
              <div className="flex-1 h-[10px] bg-[rgba(38,38,38,0.04)] rounded-sm">
                <div
                  className={`h-full transition-all duration-500 rounded-sm ${
                    isDominant
                      ? 'bg-[--accent-rose]'
                      : row.count > 0
                        ? 'bg-[rgba(38,38,38,0.08)]'
                        : ''
                  }`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className="text-micro text-[--text-ghost] tabular-nums w-[16px] shrink-0">
                {row.count}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-[var(--space-3)] flex items-baseline gap-[var(--space-3)]">
        <span className="text-[20px] font-light text-[--text-primary] tabular-nums">
          {stats.averageRating?.toFixed(1)}
        </span>
        <span className="text-micro text-[--text-ghost]">
          AVG FROM {stats.totalReviews} REVIEW{stats.totalReviews !== 1 ? 'S' : ''}
        </span>
      </div>
    </div>
  );
}
