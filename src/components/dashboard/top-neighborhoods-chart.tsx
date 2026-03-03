import { BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import Link from 'next/link';

import { ChartContainer } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';

const chartConfig = {
  avgRating: {
    label: 'Avg Rating',
    color: 'rgba(0, 0, 0, 0.70)',
  },
};

export function TopNeighborhoodsChart() {
  const { data: neighborhoods, isLoading } =
    trpc.getTopNeighborhoods.useQuery({ limit: 8 });

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  if (!neighborhoods || neighborhoods.length === 0) {
    return (
      <p className="text-body text-[--text-tertiary] py-[var(--space-4)]">
        Not enough data yet.
      </p>
    );
  }

  const chartData = neighborhoods.map((n) => ({
    id: n.id,
    name: n.name.length > 16 ? n.name.slice(0, 14) + '...' : n.name,
    fullName: n.name,
    avgRating: Math.round(n.avgRating * 10) / 10,
  }));

  return (
    <div>
      <ChartContainer config={chartConfig} className="h-[200px] w-full aspect-auto">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 32, bottom: 0, left: 0 }}
        >
          <XAxis type="number" hide domain={[0, 5]} />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 9,
              fill: 'rgba(0, 0, 0, 0.45)',
              fontFamily: 'var(--font-mono)',
            }}
          />
          <Bar
            dataKey="avgRating"
            radius={0}
            maxBarSize={12}
            label={{
              position: 'right',
              fontSize: 9,
              fill: 'rgba(0, 0, 0, 0.45)',
              fontFamily: 'var(--font-mono)',
              formatter: (value: number) => value.toFixed(1),
            }}
          >
            {chartData.map((entry) => (
              <Cell key={entry.id} fill="rgba(0, 0, 0, 0.65)" />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      <div className="mt-[var(--space-3)] space-y-0">
        {neighborhoods.slice(0, 3).map((n, i) => (
          <Link
            key={n.id}
            href={`/neighborhoods/${n.id}`}
            className="flex items-center justify-between py-[6px] text-caption hover:bg-[--bg-surface-1] transition-colors px-1"
          >
            <span className="text-[--text-secondary]">
              {i + 1}. {n.name}
            </span>
            <span className="text-micro text-[--text-ghost] tabular-nums">
              {n.avgRating.toFixed(1)} AVG
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
