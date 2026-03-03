import { useState } from 'react';
import { SearchIcon } from 'lucide-react';

import { DashboardLayout } from '@/components/dashboard-layout';
import { NeighborhoodCard } from '@/components/neighborhood-card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';

const PAGE_SIZE = 12;

export default function NeighborhoodsPage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [offset, setOffset] = useState(0);

  const { data, isLoading } = trpc.neighborhoods.list.useQuery({
    search: search || undefined,
    city: city || undefined,
    state: state || undefined,
    limit: PAGE_SIZE,
    offset,
  });

  const resetOffset = () => setOffset(0);

  return (
    <DashboardLayout title="Neighborhoods">
      <div className="flex flex-col gap-[var(--space-8)] py-[var(--space-6)]">
        {/* Filters */}
        <div className="flex flex-col gap-[var(--space-2)] px-[var(--space-6)] sm:flex-row animate-fade-up">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[--text-ghost]" />
            <Input
              placeholder="Search neighborhoods..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetOffset();
              }}
              className="pl-9"
            />
          </div>
          <Input
            placeholder="City"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              resetOffset();
            }}
            className="sm:w-40"
          />
          <Input
            placeholder="State"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              resetOffset();
            }}
            className="sm:w-28"
          />
        </div>

        {/* Results */}
        <div className="px-[var(--space-6)]">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-px md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[180px] w-full" />
              ))}
            </div>
          ) : data?.neighborhoods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-[var(--space-16)] text-center">
              <p className="text-heading font-light text-[--text-secondary]">
                No neighborhoods found
              </p>
              <p className="mt-[var(--space-2)] text-caption text-[--text-tertiary]">
                Try adjusting your search filters.
              </p>
            </div>
          ) : (
            <>
              {/* Result count */}
              <p className="text-micro text-[--text-ghost] mb-[var(--space-3)]">
                {data?.pagination.total} RESULTS
              </p>

              <div className="grid grid-cols-1 gap-px md:grid-cols-2 lg:grid-cols-3">
                {data?.neighborhoods.map((n, i) => (
                  <div
                    key={n.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <NeighborhoodCard neighborhood={n} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {data?.pagination && (
                <div className="mt-[var(--space-8)] flex items-center justify-between">
                  <p className="text-micro text-[--text-ghost] tabular-nums">
                    {offset + 1}&ndash;{Math.min(offset + PAGE_SIZE, data.pagination.total)} OF {data.pagination.total}
                  </p>
                  <div className="flex gap-px">
                    <button
                      onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                      disabled={offset === 0}
                      className="surface-1 px-[var(--space-4)] py-[var(--space-2)] text-[10px] uppercase tracking-[0.18em] text-[--text-tertiary] transition-colors hover:bg-[--bg-surface-2] hover:text-[--text-secondary] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setOffset(offset + PAGE_SIZE)}
                      disabled={!data.pagination.hasMore}
                      className="surface-1 px-[var(--space-4)] py-[var(--space-2)] text-[10px] uppercase tracking-[0.18em] text-[--text-tertiary] transition-colors hover:bg-[--bg-surface-2] hover:text-[--text-secondary] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
