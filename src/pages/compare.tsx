import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';

import { DashboardLayout } from '@/components/dashboard-layout';
import { StarRating } from '@/components/star-rating';
import { RatingDistributionChart } from '@/components/rating-distribution-chart';
import { FavoriteButton } from '@/components/favorite-button';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';

function formatCompactDollars(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function getRiskLabel(violent: number | null, property: number | null) {
  if (violent == null && property == null) return null;
  const v = violent ?? 0;
  const p = property ?? 0;
  if (v < 200 && p < 1500) return 'LOW';
  if (v < 400 && p < 2500) return 'MOD';
  return 'HIGH';
}

function CompareColumn({ id }: { id: string }) {
  const { data: neighborhood, isLoading } =
    trpc.neighborhoods.getById.useQuery({ id });
  const { data: extData } = trpc.data.getAll.useQuery(
    { neighborhoodId: id },
    { enabled: !!id },
  );

  if (isLoading) {
    return (
      <div className="space-y-px">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!neighborhood) {
    return <p className="text-body text-[--text-tertiary]">Not found</p>;
  }

  return (
    <div className="surface-flat rounded-lg p-[var(--space-5)] animate-reveal">
      {/* Name + Favorite */}
      <div className="flex items-start justify-between mb-[var(--space-3)]">
        <Link
          href={`/neighborhoods/${neighborhood.id}`}
          className="text-heading font-light text-[--text-primary] hover:text-[--text-secondary] transition-colors"
        >
          {neighborhood.name}
        </Link>
        <FavoriteButton neighborhoodId={neighborhood.id} />
      </div>

      <p className="text-caption text-[--text-tertiary] mb-[var(--space-4)]">
        {neighborhood.city}, {neighborhood.state} {neighborhood.zip}
      </p>

      {/* Stats */}
      <div className="space-y-[var(--space-3)] mb-[var(--space-4)]">
        <div className="flex items-center justify-between border-b border-[rgba(38,38,38,0.08)] pb-[var(--space-2)]">
          <span className="text-micro text-[--text-ghost]">AVG RATING</span>
          <div className="flex items-center gap-[var(--space-2)]">
            {neighborhood.avgRating !== null ? (
              <>
                <StarRating value={Math.round(neighborhood.avgRating)} readonly />
                <span className="text-body text-[--text-primary] tabular-nums">
                  {neighborhood.avgRating.toFixed(1)}
                </span>
              </>
            ) : (
              <span className="text-caption text-[--text-ghost]">—</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-[rgba(38,38,38,0.08)] pb-[var(--space-2)]">
          <span className="text-micro text-[--text-ghost]">REVIEWS</span>
          <span className="text-body text-[--text-primary] tabular-nums">
            {neighborhood._count.reviews}
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-[rgba(38,38,38,0.08)] pb-[var(--space-2)]">
          <span className="text-micro text-[--text-ghost]">FAVORITES</span>
          <span className="text-body text-[--text-primary] tabular-nums">
            {neighborhood._count.favorites}
          </span>
        </div>

        {extData?.walkScore?.walkScore != null && (
          <div className="flex items-center justify-between border-b border-[rgba(38,38,38,0.08)] pb-[var(--space-2)]">
            <span className="text-micro text-[--text-ghost]">WALK SCORE</span>
            <span className="text-body text-[--text-primary] tabular-nums">
              {extData.walkScore.walkScore}
            </span>
          </div>
        )}

        {extData?.rentData?.medianRent != null && (
          <div className="flex items-center justify-between border-b border-[rgba(38,38,38,0.08)] pb-[var(--space-2)]">
            <span className="text-micro text-[--text-ghost]">MEDIAN RENT</span>
            <span className="text-body text-[--text-primary] tabular-nums">
              {formatCompactDollars(extData.rentData.medianRent)}
            </span>
          </div>
        )}

        {extData?.crimeData && extData.crimeData.dataQuality !== 'unavailable' && (
          <div className="flex items-center justify-between border-b border-[rgba(38,38,38,0.08)] pb-[var(--space-2)]">
            <span className="text-micro text-[--text-ghost]">SAFETY</span>
            <span className="text-body text-[--text-primary]">
              {getRiskLabel(extData.crimeData.violentCrimeRate, extData.crimeData.propertyCrimeRate) ?? '—'}
            </span>
          </div>
        )}

        {extData?.costOfLiving?.cpi?.value != null && (
          <div className="flex items-center justify-between border-b border-[rgba(38,38,38,0.08)] pb-[var(--space-2)]">
            <span className="text-micro text-[--text-ghost]">CPI INDEX</span>
            <span className="text-body text-[--text-primary] tabular-nums">
              {extData.costOfLiving.cpi.value.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Rating Distribution */}
      <RatingDistributionChart neighborhoodId={neighborhood.id} />

      {/* Description */}
      {neighborhood.description && (
        <div className="mt-[var(--space-4)]">
          <p className="text-micro text-[--text-ghost] mb-[var(--space-2)]">ABOUT</p>
          <p className="text-body text-[--text-secondary]">{neighborhood.description}</p>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const ids = (router.query.ids as string)?.split(',').filter(Boolean) ?? [];

  if (ids.length < 2) {
    return (
      <DashboardLayout title="Compare">
        <div className="flex flex-col items-center justify-center py-[var(--space-16)]">
          <p className="text-heading font-light text-[--text-secondary]">
            Select 2–3 neighborhoods to compare
          </p>
          <Link
            href="/neighborhoods"
            className="mt-[var(--space-4)] text-micro text-[--text-ghost] hover:text-[--text-secondary] transition-colors"
          >
            BROWSE NEIGHBORHOODS
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Compare">
      <div className="p-[var(--space-6)]">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-micro text-[--text-ghost] hover:text-[--text-secondary] transition-colors mb-[var(--space-4)]"
        >
          <ArrowLeftIcon className="h-3 w-3" />
          BACK
        </button>

        <div className={`grid gap-px ${ids.length === 3 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {ids.map((id) => (
            <CompareColumn key={id} id={id} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
