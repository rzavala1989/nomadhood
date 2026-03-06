import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { SearchIcon, MapIcon, ListIcon } from 'lucide-react';

import { PageLayout } from '@/components/page-layout';
import { NeighborhoodCard } from '@/components/neighborhood-card';
import { NeighborhoodMap } from '@/components/neighborhood-map-wrapper';
import { Pagination } from '@/components/pagination';
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

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'most_reviews' | 'most_favorites';

export default function NeighborhoodsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [view, setView] = useState<'list' | 'map' | 'split'>('split');
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0);

  const rawPage = Number(router.query.page);
  const rawPageSize = Number(router.query.pageSize);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : DEFAULT_PAGE;
  const pageSize = Number.isFinite(rawPageSize) && rawPageSize >= 1 ? Math.floor(rawPageSize) : DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  const { data, isLoading } = trpc.neighborhoods.list.useQuery({
    search: search || undefined,
    city: city || undefined,
    state: state || undefined,
    sortBy,
    limit: pageSize,
    offset,
  });

  const neighborhoodIds = useMemo(
    () => data?.neighborhoods?.map((n) => n.id) ?? [],
    [data?.neighborhoods],
  );

  const { data: imageMap } = trpc.data.getImages.useQuery(
    { neighborhoodIds },
    { enabled: neighborhoodIds.length > 0 },
  );

  const filteredNeighborhoods = useMemo(() => {
    if (!data?.neighborhoods || minScore <= 0) return data?.neighborhoods;
    return data.neighborhoods.filter((n) => (n.nomadScore ?? 0) >= minScore);
  }, [data?.neighborhoods, minScore]);

  const totalItems = data?.pagination.total ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const pushPage = (newPage: number, newPageSize?: number) => {
    void router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          page: String(newPage),
          pageSize: String(newPageSize ?? pageSize),
        },
      },
      undefined,
      { shallow: true },
    );
  };

  const resetPage = () => pushPage(1);

  return (
    <PageLayout title="Neighborhoods">
      <div className="flex h-[calc(100vh-3rem)] flex-col overflow-hidden">
        {/* Filter Bar */}
        <div className="flex flex-col gap-[var(--space-2)] px-[var(--space-6)] py-[var(--space-4)] animate-reveal">
          <div className="flex flex-col gap-[var(--space-2)] sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[--text-ghost]" />
              <Input
                placeholder="Search neighborhoods..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
                className="pl-9"
              />
            </div>
            <Input
              placeholder="City"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                resetPage();
              }}
              className="sm:w-36"
            />
            <Select
              value={state}
              onValueChange={(v) => {
                setState(v === 'all' ? '' : v);
                resetPage();
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

          <div className="flex items-center justify-between gap-[var(--space-4)]">
            <Select
              value={sortBy}
              onValueChange={(v) => {
                setSortBy(v as SortOption);
                resetPage();
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

            <div className="hidden sm:flex items-center gap-[var(--space-2)]">
              <span className="text-micro text-[--text-ghost]">MIN SCORE</span>
              <input
                type="range"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="nomad-range w-24"
              />
              <span className="text-micro text-[--text-tertiary] w-5 text-right tabular-nums">
                {minScore}
              </span>
            </div>

            <div className="hidden sm:flex gap-1">
              {([
                { key: 'list', icon: ListIcon, label: 'List' },
                { key: 'split', icon: MapIcon, label: 'Split' },
                { key: 'map', icon: MapIcon, label: 'Map' },
              ] as const).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`flex items-center gap-1 px-[var(--space-3)] py-[var(--space-2)] text-[9px] uppercase tracking-[0.18em] transition-colors rounded-md ${
                    view === key
                      ? 'bg-[--accent-rose] text-[--accent-charcoal]'
                      : 'surface-flat text-[--text-tertiary] hover:bg-[--bg-secondary] hover:text-[--text-secondary]'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Mobile toggle */}
            <div className="flex sm:hidden gap-1">
              <button
                onClick={() => setView(view === 'map' ? 'list' : 'map')}
                className="surface-flat rounded-md flex items-center gap-1 px-[var(--space-3)] py-[var(--space-2)] text-[9px] uppercase tracking-[0.18em] text-[--text-tertiary] hover:bg-[--bg-secondary]"
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
                <div className={'grid grid-cols-2 gap-x-8 gap-y-0'}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className={`aspect-square w-full rounded-lg mb-12 ${i % 2 === 1 ? 'md:mt-[100px]' : ''}`} />
                  ))}
                </div>
              ) : !filteredNeighborhoods || filteredNeighborhoods.length === 0 ? (
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
                  {minScore > 0 && data?.neighborhoods && (
                    <p className="text-micro text-[--text-ghost] mb-[var(--space-2)]">
                      Showing {filteredNeighborhoods?.length ?? 0} of {data.neighborhoods.length}
                    </p>
                  )}
                  <div className={'grid grid-cols-2 gap-x-8 gap-y-0'}>
                    {filteredNeighborhoods?.map((n, i) => (
                      <div
                        key={n.id}
                        className={`animate-reveal mb-12 rounded-lg ${
                          i % 2 === 1 ? 'md:mt-[100px]' : ''
                        } ${
                          selectedMapId === n.id ? 'ring-2 ring-[--accent-rose]' : ''
                        }`}
                        style={{ animationDelay: `${i * 60}ms` }}
                        onMouseEnter={() => setSelectedMapId(n.id)}
                        onMouseLeave={() => setSelectedMapId(null)}
                      >
                        <NeighborhoodCard
                          neighborhood={n}
                          nomadScore={n.nomadScore}
                          imageUrl={imageMap?.[n.id]?.[0]?.thumbUrl ?? imageMap?.[n.id]?.[0]?.imageUrl}
                          imageAlt={imageMap?.[n.id]?.[0]?.altText ?? undefined}
                          imageSource={imageMap?.[n.id]?.[0]?.source}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="mt-[var(--space-8)]">
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      totalItems={totalItems}
                      onPageChange={(newPage) => pushPage(newPage)}
                      onPageSizeChange={(newSize) => pushPage(1, newSize)}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Map Panel */}
          {view !== 'list' && (
            <div
              className={`${
                view === 'split' ? 'w-full lg:w-1/2' : 'w-full'
              } h-full`}
            >
              {data?.neighborhoods ? (
                <NeighborhoodMap
                  neighborhoods={data.neighborhoods}
                  selectedId={selectedMapId}
                  onSelect={setSelectedMapId}
                  minScore={minScore}
                  imageMap={imageMap}
                />
              ) : (
                <Skeleton className="h-full w-full" />
              )}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
