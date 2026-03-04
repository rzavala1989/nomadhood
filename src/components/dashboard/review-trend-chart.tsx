import { AreaChart, Area, XAxis, YAxis } from 'recharts';

import { ChartContainer } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';

const chartConfig = {
  count: {
    label: 'Reviews',
    color: 'rgba(0, 0, 0, 0.60)',
  },
};

export function ReviewTrendChart() {
  const { data: trend, isLoading } = trpc.dashboard.getReviewTrend.useQuery();

  if (isLoading) {
    return <Skeleton className="h-[160px] w-full" />;
  }

  if (!trend || trend.every((d) => d.count === 0)) {
    return (
      <p className="text-body text-[--text-tertiary] py-[var(--space-4)]">
        No review data yet.
      </p>
    );
  }

  const maxCount = Math.max(...trend.map((d) => d.count), 1);

  return (
    <ChartContainer config={chartConfig} className="h-[160px] w-full aspect-auto">
      <AreaChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="reviewFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="rgba(0, 0, 0, 0.12)" />
            <stop offset="95%" stopColor="rgba(0, 0, 0, 0.02)" />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{
            fontSize: 9,
            fill: 'rgba(0, 0, 0, 0.40)',
            fontFamily: 'var(--font-mono)',
          }}
        />
        <YAxis
          hide
          domain={[0, maxCount + 1]}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="rgba(0, 0, 0, 0.60)"
          strokeWidth={1.5}
          fill="url(#reviewFill)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
