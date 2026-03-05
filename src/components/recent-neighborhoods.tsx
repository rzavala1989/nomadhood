import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';

export function RecentNeighborhoods() {
  const { data, isLoading } = trpc.neighborhoods.list.useQuery({ limit: 5 });

  return (
    <div className="surface-1 animate-fade-up" style={{ animationDelay: '250ms' }}>
      <div className="flex items-center justify-between p-[var(--space-5)] pb-[var(--space-3)]">
        <p className="text-label text-[--text-ghost]">RECENT NEIGHBORHOODS</p>
        <Link
          href="/neighborhoods"
          className="flex items-center gap-1 text-micro text-[--text-ghost] transition-colors hover:text-[--text-secondary]"
        >
          VIEW ALL
          <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="px-[var(--space-5)] pb-[var(--space-5)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="mb-px h-[42px] w-full" />
          ))}
        </div>
      ) : data?.neighborhoods.length === 0 ? (
        <p className="px-[var(--space-5)] pb-[var(--space-5)] text-body text-[--text-tertiary]">
          No neighborhoods yet.
        </p>
      ) : (
        <div>
          {data?.neighborhoods.map((n) => (
            <Link
              key={n.id}
              href={`/neighborhoods/${n.id}`}
              className="flex items-center justify-between px-[var(--space-5)] py-[10px] transition-colors hover:bg-[--bg-surface-2] border-t border-[rgba(120,80,200,0.08)]"
            >
              <div className="flex items-center gap-[var(--space-3)]">
                <span className="text-body text-[--text-primary] font-medium">
                  {n.name}
                </span>
                <span className="text-caption text-[--text-tertiary]">
                  {n.city}, {n.state}
                </span>
              </div>
              <span className="text-micro text-[--text-ghost] tabular-nums">
                {n._count.reviews} REVIEWS
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
