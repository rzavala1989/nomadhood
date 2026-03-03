import { BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';

import { ChartContainer } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';

const chartConfig = {
  count: {
    label: 'Reviews',
    color: 'rgba(0, 0, 0, 0.70)',
  },
};

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

  const chartData = [5, 4, 3, 2, 1].map((star) => ({
    star: `${star}`,
    count: stats.ratingDistribution[star as keyof typeof stats.ratingDistribution],
  }));

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div className="surface-1 p-[var(--space-5)]">
      <p className="text-label text-[--text-ghost] mb-[var(--space-3)]">
        RATING DISTRIBUTION
      </p>

      <ChartContainer config={chartConfig} className="h-[120px] w-full aspect-auto">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <XAxis type="number" hide domain={[0, maxCount]} />
          <YAxis
            type="category"
            dataKey="star"
            width={24}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fill: 'rgba(0, 0, 0, 0.45)',
              fontFamily: 'var(--font-mono)',
            }}
            tickFormatter={(value: string) => `${value}\u2605`}
          />
          <Bar dataKey="count" radius={0} maxBarSize={14}>
            {chartData.map((entry) => (
              <Cell
                key={entry.star}
                fill={
                  entry.count > 0
                    ? 'rgba(0, 0, 0, 0.70)'
                    : 'rgba(0, 0, 0, 0.06)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

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
