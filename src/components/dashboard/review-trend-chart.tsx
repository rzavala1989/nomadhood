import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';

import { ChartContainer } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';

const chartConfig = {
  count: {
    label: 'Reviews',
    color: '#FF6B9D',
  },
};

export function ReviewTrendChart() {
  const { data: trend, isLoading } = trpc.dashboard.getReviewTrend.useQuery();

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  if (!trend || trend.every((d) => d.count === 0)) {
    return (
      <p className="text-body text-[--text-tertiary] py-[var(--space-4)]">
        No review data yet.
      </p>
    );
  }

  const maxCount = Math.max(...trend.map((d) => d.count), 1);
  const avgCount = Math.round(trend.reduce((s, d) => s + d.count, 0) / trend.length);

  // Check if last data point drops significantly (possible incomplete period)
  const lastTwo = trend.slice(-2);
  const hasTrailingDrop =
    lastTwo.length === 2 && lastTwo[1].count < lastTwo[0].count * 0.5 && lastTwo[0].count > 0;

  return (
    <div>
      <ChartContainer config={chartConfig} className="h-[200px] w-full aspect-auto">
        <AreaChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="reviewFillPink" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF6B9D" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#FF6B9D" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 9,
              fill: 'rgba(26, 16, 40, 0.35)',
              fontFamily: 'var(--font-mono)',
            }}
          />
          <YAxis hide domain={[0, maxCount + 2]} />
          <ReferenceLine
            y={avgCount}
            stroke="rgba(26, 16, 40, 0.08)"
            strokeDasharray="3 3"
            label={{
              value: `AVG ${avgCount}`,
              position: 'right',
              fontSize: 8,
              fill: 'rgba(26, 16, 40, 0.22)',
              fontFamily: 'var(--font-mono)',
            }}
          />
          <Tooltip
            contentStyle={{
              background: '#1A1028',
              border: 'none',
              borderRadius: 0,
              fontSize: 10,
              color: '#F8F6FC',
              padding: '4px 8px',
            }}
            itemStyle={{ color: '#FF6B9D', fontSize: 10 }}
            labelStyle={{ color: 'rgba(248, 246, 252, 0.6)', fontSize: 9 }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#FF6B9D"
            strokeWidth={1.5}
            fill="url(#reviewFillPink)"
            dot={false}
            activeDot={{ r: 3, fill: '#FF6B9D', strokeWidth: 0 }}
          />
        </AreaChart>
      </ChartContainer>
      {hasTrailingDrop && (
        <p className="text-micro text-[--text-ghost] mt-[var(--space-1)]">
          Most recent period may be incomplete
        </p>
      )}
    </div>
  );
}
