import Link from 'next/link';
import { trpc } from '@/utils/trpc';

function TrendRow({
  item,
  maxScore,
  variant,
  index,
}: {
  item: { neighborhoodId: string; name: string; city: string; state: string; score: number; articleCount7d: number };
  maxScore: number;
  variant: 'hot' | 'cold';
  index: number;
}) {
  const barWidth = maxScore > 0 ? Math.max((item.score / maxScore) * 100, 4) : 4;

  return (
    <Link
      href={`/neighborhoods/${item.neighborhoodId}`}
      className="flex items-center gap-[var(--space-3)] h-[40px] px-[var(--space-3)] border-t border-[rgba(120,80,200,0.06)] hover:bg-[--bg-surface-1] transition-colors animate-fade-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-caption text-[--text-secondary] truncate">{item.name}</p>
        <p className="text-micro text-[--text-ghost]">
          {item.city}, {item.state}
        </p>
      </div>
      <div className="w-[80px] shrink-0">
        <div className="h-[3px] w-full bg-[rgba(120,80,200,0.06)]">
          <div
            className={`h-full transition-all duration-500 ${
              variant === 'hot' ? 'bg-[--vapor-pink]' : 'bg-[rgba(120,80,200,0.22)]'
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
      <span className="text-micro text-[--text-ghost] tabular-nums shrink-0 w-[60px] text-right">
        {item.articleCount7d} article{item.articleCount7d !== 1 ? 's' : ''}
      </span>
    </Link>
  );
}

export function NewsTrending() {
  const { data: trending, isLoading } = trpc.news.getTrending.useQuery({ limit: 5 });

  if (isLoading || !trending) return null;

  const hasHeating = trending.heatingUp.length > 0;
  const hasCooling = trending.coolingDown.length > 0;

  if (!hasHeating && !hasCooling) return null;

  const heatingMax = hasHeating ? Math.max(...trending.heatingUp.map((h) => h.score)) : 0;
  const coolingMax = hasCooling ? Math.max(...trending.coolingDown.map((c) => c.score)) : 0;

  return (
    <div>
      <p className="text-label text-[--text-ghost] mb-[var(--space-2)]">NEWS PULSE</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px">
        {/* Heating Up */}
        <div className="surface-1 p-[var(--space-4)]">
          <p className="text-label text-[--text-ghost] mb-[var(--space-2)]">HEATING UP</p>
          {hasHeating ? (
            trending.heatingUp.map((item, i) => (
              <TrendRow key={item.neighborhoodId} item={item} maxScore={heatingMax} variant="hot" index={i} />
            ))
          ) : (
            <p className="text-micro text-[--text-tertiary]">No trending data yet</p>
          )}
        </div>

        {/* Cooling Down */}
        <div className="surface-1 p-[var(--space-4)]">
          <p className="text-label text-[--text-ghost] mb-[var(--space-2)]">COOLING DOWN</p>
          {hasCooling ? (
            trending.coolingDown.map((item, i) => (
              <TrendRow key={item.neighborhoodId} item={item} maxScore={coolingMax} variant="cold" index={i} />
            ))
          ) : (
            <p className="text-micro text-[--text-tertiary]">No trending data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
