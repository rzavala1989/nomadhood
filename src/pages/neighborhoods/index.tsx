import { useState } from 'react';
import { SearchIcon, MapIcon, ListIcon } from 'lucide-react';

import { DashboardLayout } from '@/components/dashboard-layout';
import { NeighborhoodCard } from '@/components/neighborhood-card';
import { NeighborhoodMap } from '@/components/neighborhood-map-wrapper';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/utils/trpc';

const PAGE_SIZE = 12;

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'most_reviews' | 'most_favorites';

export default function NeighborhoodsPage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [offset, setOffset] = useState(0);
  const [view, setView] = useState<'list' | 'map' | 'split'>('split');
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);

  const { data, isLoading } = trpc.neighborhoods.list.useQuery({
    search: search || undefined,
    city: city || undefined,
    state: state || undefined,
    sortBy,
    limit: PAGE_SIZE,
    offset,
  });

  const { data: scores } = trpc.neighborhoods.getWithScores.useQuery();

  const resetOffset = () => setOffset(0);

  return (
    <DashboardLayout title="Neighborhoods">
      <div className="flex h-full flex-col">
        {/* Filter Bar */}
        <div className="flex flex-col gap-[var(--space-2)] px-[var(--space-6)] py-[var(--space-4)] animate-fade-up">
          <div className="flex flex-col gap-[var(--space-2)] sm:flex-row">
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
              className="sm:w-36"
            />
            <Select
              value={state}
              onValueChange={(v) => {
                setState(v === 'all' ? '' : v);
                resetOffset();
              }}
            >
              <SelectTrigger className="sm:w-28 text-micro">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {US_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Select
              value={sortBy}
              onValueChange={(v) => {
                setSortBy(v as SortOption);
                resetOffset();
              }}
            >
              <SelectTrigger className="w-44 text-micro">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name_asc">Name A–Z</SelectItem>
                <SelectItem value="name_desc">Name Z–A</SelectItem>
                <SelectItem value="most_reviews">Most Reviews</SelectItem>
                <SelectItem value="most_favorites">Most Favorites</SelectItem>
              </SelectContent>
            </Select>

            <div className="hidden sm:flex gap-px">
              {([
                { key: 'list', icon: ListIcon, label: 'List' },
                { key: 'split', icon: MapIcon, label: 'Split' },
                { key: 'map', icon: MapIcon, label: 'Map' },
              ] as const).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`flex items-center gap-1 px-[var(--space-3)] py-[var(--space-2)] text-[9px] uppercase tracking-[0.18em] transition-colors ${
                    view === key
                      ? 'bg-[--bg-inverse] text-[--text-inverse]'
                      : 'surface-1 text-[--text-tertiary] hover:text-[--text-secondary]'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Mobile toggle */}
            <div className="flex sm:hidden gap-px">
              <button
                onClick={() => setView(view === 'map' ? 'list' : 'map')}
                className="surface-1 flex items-center gap-1 px-[var(--space-3)] py-[var(--space-2)] text-[9px] uppercase tracking-[0.18em] text-[--text-tertiary]"
              >
                {view === 'map' ? (
                  <><ListIcon className="h-3 w-3" /> List</>
                ) : (
                  <><MapIcon className="h-3 w-3" /> Map</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 min-h-0">
          {/* List Panel */}
          {view !== 'map' && (
            <div
              className={`overflow-y-auto px-[var(--space-6)] pb-[var(--space-6)] ${
                view === 'split' ? 'w-1/2 hidden lg:block' : 'w-full'
              }`}
            >
              {isLoading ? (
                <div className={`grid gap-px ${view === 'list' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
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
                  <p className="text-micro text-[--text-ghost] mb-[var(--space-3)]">
                    {data?.pagination.total} RESULTS
                  </p>

                  <div className={`grid gap-px ${view === 'list' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {data?.neighborhoods.map((n, i) => (
                      <div
                        key={n.id}
                        className={`animate-fade-up ${
                          selectedMapId === n.id ? 'ring-2 ring-[--bg-inverse]' : ''
                        }`}
                        style={{ animationDelay: `${i * 60}ms` }}
                        onMouseEnter={() => setSelectedMapId(n.id)}
                        onMouseLeave={() => setSelectedMapId(null)}
                      >
                        <NeighborhoodCard neighborhood={n} nomadScore={scores?.[n.id]} />
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
          )}

          {/* Map Panel */}
          {view !== 'list' && (
            <div
              className={`${
                view === 'split' ? 'w-full lg:w-1/2' : 'w-full'
              } min-h-[400px]`}
            >
              {data?.neighborhoods ? (
                <NeighborhoodMap
                  neighborhoods={data.neighborhoods}
                  selectedId={selectedMapId}
                  onSelect={setSelectedMapId}
                />
              ) : (
                <Skeleton className="h-full w-full" />
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
