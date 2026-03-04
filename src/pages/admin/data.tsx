import { toast } from 'sonner';

import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';

type FetchResult = { fetched: number; skipped: number; failed: number };

function FetchResultDisplay({ result }: { result: FetchResult }) {
  return (
    <div className="flex gap-[var(--space-4)] mt-[var(--space-2)]">
      <span className="text-micro text-[--text-tertiary] tabular-nums">
        {result.fetched} FETCHED
      </span>
      <span className="text-micro text-[--text-ghost] tabular-nums">
        {result.skipped} SKIPPED
      </span>
      {result.failed > 0 && (
        <span className="text-micro text-[--text-tertiary] tabular-nums">
          {result.failed} FAILED
        </span>
      )}
    </div>
  );
}

function ServiceCard({
  label,
  description,
  onFetch,
  isPending,
  result,
  extra,
}: {
  label: string;
  description: string;
  onFetch: () => void;
  isPending: boolean;
  result: FetchResult | null;
  extra?: React.ReactNode;
}) {
  return (
    <div className="surface-1 p-[var(--space-5)] space-y-[var(--space-3)]">
      <p className="text-label text-[--text-ghost]">{label}</p>
      <p className="text-caption text-[--text-secondary]">{description}</p>
      {extra}
      <Button
        onClick={onFetch}
        disabled={isPending}
        className="mt-[var(--space-2)]"
      >
        {isPending ? 'FETCHING...' : 'FETCH'}
      </Button>
      {result && <FetchResultDisplay result={result} />}
    </div>
  );
}

export default function AdminDataPage() {
  const rentcastUsage = trpc.data.getRentcastUsage.useQuery();

  const fetchWalkScores = trpc.data.fetchWalkScores.useMutation({
    onSuccess: (r) => toast.success(`Walk Scores: ${r.fetched} fetched, ${r.skipped} skipped`),
    onError: () => toast.error('Walk Score fetch failed'),
  });

  const fetchRentData = trpc.data.fetchRentData.useMutation({
    onSuccess: (r) => {
      toast.success(`Rentcast: ${r.fetched} fetched, ${r.skipped} skipped`);
      rentcastUsage.refetch();
    },
    onError: () => toast.error('Rentcast fetch failed'),
  });

  const fetchCrimeData = trpc.data.fetchCrimeData.useMutation({
    onSuccess: (r) => toast.success(`Crime Data: ${r.fetched} fetched, ${r.skipped} skipped`),
    onError: () => toast.error('Crime data fetch failed'),
  });

  const fetchCostOfLiving = trpc.data.fetchCostOfLiving.useMutation({
    onSuccess: (r) => toast.success(`BLS: ${r.fetched} fetched, ${r.skipped} skipped`),
    onError: () => toast.error('BLS fetch failed'),
  });

  const fetchEvents = trpc.data.fetchEvents.useMutation({
    onSuccess: (r) => toast.success(`Events: ${r.fetched} fetched, ${r.skipped} skipped`),
    onError: () => toast.error('Events fetch failed'),
  });

  const anyPending =
    fetchWalkScores.isPending ||
    fetchRentData.isPending ||
    fetchCrimeData.isPending ||
    fetchCostOfLiving.isPending ||
    fetchEvents.isPending;

  function fetchAll() {
    fetchWalkScores.mutate();
    fetchRentData.mutate();
    fetchCrimeData.mutate();
    fetchCostOfLiving.mutate();
    fetchEvents.mutate();
  }

  return (
    <AdminLayout title="Admin — Data">
      <div className="space-y-[var(--space-6)]">
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <p className="text-micro text-[--text-ghost]">EXTERNAL API DATA</p>
            <p className="text-caption text-[--text-secondary] mt-[var(--space-1)]">
              Fetch data from external APIs into the local cache. Skips entries with valid cache.
            </p>
          </div>
          <Button onClick={fetchAll} disabled={anyPending}>
            {anyPending ? 'FETCHING...' : 'FETCH ALL'}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px">
          <ServiceCard
            label="WALK SCORE"
            description="Walkability, transit, and bike scores. 5,000 calls/day. 60-day cache."
            onFetch={() => fetchWalkScores.mutate()}
            isPending={fetchWalkScores.isPending}
            result={fetchWalkScores.data ?? null}
          />

          <ServiceCard
            label="RENTCAST"
            description="Median rent and sale prices by zip. 50 calls/month. 30-day cache."
            onFetch={() => fetchRentData.mutate()}
            isPending={fetchRentData.isPending}
            result={fetchRentData.data ?? null}
            extra={
              rentcastUsage.data && (
                <p className="text-micro text-[--text-tertiary] tabular-nums">
                  {rentcastUsage.data.callCount}/45 CALLS THIS MONTH
                </p>
              )
            }
          />

          <ServiceCard
            label="FBI CRIME DATA"
            description="Violent and property crime rates by city. 1,000 calls/hour. 90-day cache."
            onFetch={() => fetchCrimeData.mutate()}
            isPending={fetchCrimeData.isPending}
            result={fetchCrimeData.data ?? null}
          />

          <ServiceCard
            label="BLS COST OF LIVING"
            description="CPI index and median wages by metro. 30-180 day cache."
            onFetch={() => fetchCostOfLiving.mutate()}
            isPending={fetchCostOfLiving.isPending}
            result={fetchCostOfLiving.data ?? null}
          />

          <ServiceCard
            label="EVENTBRITE"
            description="Upcoming local events from configured sources. 24-hour cache."
            onFetch={() => fetchEvents.mutate()}
            isPending={fetchEvents.isPending}
            result={fetchEvents.data ?? null}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
