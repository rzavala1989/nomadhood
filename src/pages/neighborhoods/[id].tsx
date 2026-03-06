import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PencilIcon, Trash2Icon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from 'lucide-react';

import { DashboardLayout } from '@/components/dashboard-layout';
import { FavoriteButton } from '@/components/favorite-button';
import { StarRating } from '@/components/star-rating';
import { ReviewForm } from '@/components/review-form';
import { RatingDistributionChart } from '@/components/rating-distribution-chart';
import { NeighborhoodMap } from '@/components/neighborhood-map-wrapper';
import { SimilarNeighborhoods } from '@/components/similar-neighborhoods';
import { NeighborhoodPulse } from '@/components/neighborhood-pulse';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { trpc } from '@/utils/trpc';
import { getInitials } from '@/utils/format';
import {
  NATIONAL,
  pctDiff,
  formatDollars,
  formatRate,
  formatUpdatedAt,
  getRiskLevel,
} from '@/components/neighborhood-data-utils';

function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy');
}

/* ── Stat pill for hero panel ── */
function StatPill({
  label,
  value,
  unit,
  delta,
  deltaInvert,
}: {
  label: string;
  value: string | null;
  unit?: string;
  delta?: { value: number; baseline: number } | null;
  deltaInvert?: boolean;
}) {
  const diff = delta ? pctDiff(delta.value, delta.baseline) : null;
  const diffGood = diff != null && deltaInvert ? diff < 0 : (diff ?? 0) > 0;

  return (
    <div className="surface-1 p-[var(--space-3)] min-w-0">
      <p className="text-label text-[--text-ghost] mb-[var(--space-1)]">{label}</p>
      <p className="text-[20px] font-light text-[--text-primary] tabular-nums leading-none truncate">
        {value ?? '--'}
        {value && unit && (
          <span className="text-micro text-[--text-tertiary] ml-[2px]">{unit}</span>
        )}
      </p>
      {diff != null && value && (
        <p className={`text-micro tabular-nums mt-[2px] ${diffGood ? 'text-[--text-secondary]' : 'text-[--text-tertiary]'}`}>
          {diff > 0 ? '+' : ''}{diff}% VS AVG
        </p>
      )}
    </div>
  );
}

export default function NeighborhoodDetailPage() {
  const router = useRouter();
  const id = router.query.id as string;
  const { data: session } = useSession();
  const [editingReview, setEditingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [expandedReviewIds, setExpandedReviewIds] = useState<Set<string>>(new Set());
  const reviewsSectionRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: neighborhood, isLoading } =
    trpc.neighborhoods.getById.useQuery({ id }, { enabled: !!id });

  const { data: externalData } = trpc.data.getAll.useQuery(
    { neighborhoodId: id },
    { enabled: !!id },
  );

  // Trigger Unsplash download tracking when an Unsplash image is displayed
  const trackDownload = trpc.data.trackUnsplashDownload.useMutation();
  const downloadTracked = useRef(false);
  const heroImage = externalData?.images?.[0] ?? null;
  useEffect(() => {
    if (
      heroImage?.source === 'unsplash' &&
      id &&
      !downloadTracked.current
    ) {
      downloadTracked.current = true;
      trackDownload.mutate({ neighborhoodId: id });
    }
  }, [heroImage?.source, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: userReview } = trpc.reviews.getUserReview.useQuery(
    { neighborhoodId: id },
    { enabled: !!id && !!session },
  );

  const deleteReview = trpc.reviews.delete.useMutation({
    onSuccess: () => {
      utils.reviews.getUserReview.invalidate({ neighborhoodId: id });
      utils.neighborhoods.getById.invalidate({ id });
      utils.dashboard.getStats.invalidate();
      toast.success('Review deleted');
    },
    onError: () => {
      toast.error('Failed to delete review');
    },
  });

  function scrollToReviews() {
    reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!userReview) setShowReviewForm(true);
  }

  function toggleReviewExpanded(reviewId: string) {
    setExpandedReviewIds((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) next.delete(reviewId);
      else next.add(reviewId);
      return next;
    });
  }

  // ── Loading skeleton ──
  if (isLoading || !id) {
    return (
      <DashboardLayout title="Neighborhood">
        <div className="p-[var(--space-6)] space-y-[var(--space-4)]">
          {/* Hero skeleton: two columns */}
          <div className="flex flex-col lg:flex-row gap-px h-[320px]">
            <Skeleton className="lg:w-[45%] h-full" />
            <Skeleton className="lg:w-[55%] h-full" />
          </div>
          {/* Scores skeleton: three columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px">
            <Skeleton className="h-[160px]" />
            <Skeleton className="h-[160px]" />
            <Skeleton className="h-[160px]" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!neighborhood) {
    return (
      <DashboardLayout title="Not Found">
        <div className="flex flex-col items-center justify-center py-[var(--space-16)]">
          <p className="text-heading font-light text-[--text-secondary]">
            Neighborhood not found.
          </p>
          <button
            onClick={() => router.push('/neighborhoods')}
            className="mt-[var(--space-4)] text-micro text-[--text-ghost] hover:text-[--text-secondary] transition-colors"
          >
            BACK TO NEIGHBORHOODS
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // ── Derive data for hero stat pills ──
  const walkScore = externalData?.walkScore?.walkScore ?? null;
  const medianRent = externalData?.rentData?.medianRent ?? null;
  const crimeData = externalData?.crimeData ?? null;
  const riskLevel = crimeData ? getRiskLevel(crimeData.violentCrimeRate, crimeData.propertyCrimeRate) : null;
  const wageHourly = externalData?.costOfLiving?.wage?.value ?? null;
  const medianAnnualWage = wageHourly != null ? Math.round(wageHourly * 2080) : null;

  const allImages = externalData?.images ?? [];
  const activeImage = allImages[activeImageIndex] ?? heroImage;
  const hasMultiple = allImages.length > 1;
  const hasImages = !!activeImage;

  return (
    <DashboardLayout title={neighborhood.name}>
      <div className="flex flex-col gap-[var(--space-6)] p-[var(--space-6)]">

        {/* ═══ 1. HERO: Image carousel + Data summary ═══ */}
        <div className={`flex flex-col lg:flex-row gap-px animate-fade-up ${hasImages ? 'h-auto lg:h-[360px]' : ''}`}>
          {/* Left: Image carousel */}
          {activeImage && (
            <div className="lg:w-[45%] h-[240px] lg:h-full flex flex-col gap-px shrink-0">
              <div className="relative flex-1 min-h-0 overflow-hidden">
                <img
                  src={activeImage.imageUrl}
                  alt={activeImage.altText ?? `${neighborhood.name} neighborhood`}
                  className="h-full w-full object-cover"
                />
                {hasMultiple && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)}
                      className="absolute left-[var(--space-2)] top-1/2 -translate-y-1/2 bg-black/40 p-1 text-white/90 hover:bg-black/60 transition-colors"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev + 1) % allImages.length)}
                      className="absolute right-[var(--space-2)] top-1/2 -translate-y-1/2 bg-black/40 p-1 text-white/90 hover:bg-black/60 transition-colors"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
                {hasMultiple && (
                  <span className="absolute top-[var(--space-2)] right-[var(--space-2)] text-[8px] tracking-[0.15em] uppercase text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] tabular-nums">
                    {activeImageIndex + 1} / {allImages.length}
                  </span>
                )}
                {/* Attribution */}
                <div className="absolute bottom-[var(--space-2)] right-[var(--space-3)]">
                  {activeImage.source === 'unsplash' && activeImage.photographerName ? (
                    <span className="text-[8px] tracking-[0.12em] uppercase text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                      Photo by{' '}
                      {activeImage.photographerUrl ? (
                        <a href={activeImage.photographerUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                          {activeImage.photographerName}
                        </a>
                      ) : activeImage.photographerName}{' '}
                      on{' '}
                      {activeImage.pageUrl ? (
                        <a href={activeImage.pageUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                          Unsplash
                        </a>
                      ) : 'Unsplash'}
                    </span>
                  ) : activeImage.source === 'wikimedia' && activeImage.photographerName ? (
                    <span className="text-[8px] tracking-[0.12em] uppercase text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                      {activeImage.photographerName} via{' '}
                      {activeImage.pageUrl ? (
                        <a href={activeImage.pageUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                          Wikimedia
                        </a>
                      ) : 'Wikimedia'}
                    </span>
                  ) : null}
                </div>
              </div>

              {hasMultiple && (
                <div className="flex gap-px overflow-x-auto h-14 shrink-0">
                  {allImages.map((img, i) => (
                    <button
                      key={img.imageUrl}
                      onClick={() => setActiveImageIndex(i)}
                      className={`relative h-full min-w-[64px] flex-1 overflow-hidden transition-opacity ${
                        i === activeImageIndex ? 'opacity-100' : 'opacity-50 hover:opacity-80'
                      }`}
                    >
                      <img
                        src={img.thumbUrl ?? img.imageUrl}
                        alt={img.altText ?? `${neighborhood.name} photo ${i + 1}`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Right: Data summary panel */}
          <div className={`${hasImages ? 'lg:w-[55%]' : 'w-full'} surface-1 p-[var(--space-5)] flex flex-col justify-between`}>
            <div>
              {/* Name and location */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-title">{neighborhood.name}</h2>
                  <p className="text-caption text-[--text-tertiary] mt-[var(--space-1)]">
                    {neighborhood.city}, {neighborhood.state} {neighborhood.zip}
                  </p>
                </div>
                <FavoriteButton neighborhoodId={neighborhood.id} />
              </div>

              {/* Star rating + review count */}
              {neighborhood.avgRating !== null && (
                <div className="flex items-center gap-[var(--space-2)] mt-[var(--space-3)]">
                  <StarRating value={Math.round(neighborhood.avgRating)} readonly />
                  <span className="text-caption text-[--text-tertiary] tabular-nums">
                    {neighborhood.avgRating.toFixed(1)}
                  </span>
                  <span className="text-micro text-[--text-ghost]">
                    ({neighborhood._count.reviews} review{neighborhood._count.reviews !== 1 ? 's' : ''})
                  </span>
                </div>
              )}

              {/* Nomad Score badge with tooltip */}
              {neighborhood.nomadScore != null && neighborhood.nomadScore > 0 && (
                <div className="mt-[var(--space-3)]">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-vapor text-white px-[var(--space-3)] py-[4px] text-[10px] tracking-[0.12em] tabular-nums inline-block cursor-help">
                          NOMAD SCORE {neighborhood.nomadScore}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[240px]">
                        <p className="text-xs">
                          Composite score (0-100) based on community reviews and external data: walkability, safety, cost of living, and local activity.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

              {/* 2x2 stat pills grid */}
              <div className="grid grid-cols-2 gap-px mt-[var(--space-4)]">
                <StatPill
                  label="WALK SCORE"
                  value={walkScore != null ? String(walkScore) : null}
                  delta={walkScore != null ? { value: walkScore, baseline: NATIONAL.walkScore } : null}
                />
                <StatPill
                  label="SAFETY"
                  value={riskLevel}
                />
                <StatPill
                  label="MEDIAN RENT"
                  value={medianRent != null ? formatDollars(medianRent) : null}
                  unit="/MO"
                  delta={medianRent != null ? { value: medianRent, baseline: NATIONAL.medianRent } : null}
                  deltaInvert
                />
                <StatPill
                  label="MEDIAN WAGE"
                  value={medianAnnualWage != null ? formatDollars(medianAnnualWage) : null}
                  unit="/YR"
                  delta={medianAnnualWage != null ? { value: medianAnnualWage, baseline: Math.round(NATIONAL.medianHourlyWage * 2080) } : null}
                />
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-px mt-[var(--space-4)]">
              {session && (
                <Button onClick={scrollToReviews} className="flex-1">
                  WRITE A REVIEW
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ═══ 2. MAP: Collapsible ═══ */}
        {neighborhood.latitude != null && neighborhood.longitude != null && (
          <div className="animate-fade-up [animation-delay:60ms]">
            <button
              onClick={() => setMapExpanded((prev) => !prev)}
              className="flex items-center gap-[var(--space-2)] text-label text-[--text-ghost] hover:text-[--text-tertiary] transition-colors mb-[var(--space-2)]"
            >
              <span>MAP</span>
              <ChevronDownIcon
                className={`h-3 w-3 transition-transform duration-200 ${mapExpanded ? 'rotate-180' : ''}`}
              />
              <span className="text-micro">{mapExpanded ? 'HIDE' : 'SHOW'}</span>
            </button>
            {mapExpanded && (
              <div className="h-[300px]">
                <NeighborhoodMap neighborhoods={[neighborhood]} />
              </div>
            )}
          </div>
        )}

        {/* ═══ 3. SCORES: 3-column grid ═══ */}
        {externalData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px animate-fade-up [animation-delay:90ms]">
            {/* Walkability */}
            {externalData.walkScore && (
              <div className="surface-1 p-[var(--space-5)] space-y-[var(--space-3)]">
                <p className="text-label text-[--text-ghost]">WALKABILITY</p>
                <div className="flex items-baseline gap-[var(--space-3)]">
                  <p className="text-[28px] font-light text-[--text-primary] tabular-nums leading-none">
                    {externalData.walkScore.walkScore ?? '--'}
                  </p>
                  {externalData.walkScore.walkScore != null && (
                    <span className="text-micro tabular-nums text-[--text-tertiary]">
                      {pctDiff(externalData.walkScore.walkScore, NATIONAL.walkScore) > 0 ? '+' : ''}
                      {pctDiff(externalData.walkScore.walkScore, NATIONAL.walkScore)}% VS AVG
                    </span>
                  )}
                </div>
                {externalData.walkScore.walkScore != null && (
                  <div className="h-[3px] w-full bg-[rgba(120,80,200,0.08)]">
                    <div
                      className="h-full bg-[#B36BFF99] transition-all duration-500"
                      style={{ width: `${externalData.walkScore.walkScore}%` }}
                    />
                  </div>
                )}

                <div className="flex gap-[var(--space-6)]">
                  {externalData.walkScore.transitScore != null && (
                    <div className="space-y-[2px]">
                      <p className="text-micro text-[--text-tertiary] tabular-nums">TRANSIT {externalData.walkScore.transitScore}</p>
                      <div className="h-[2px] w-[60px] bg-[rgba(120,80,200,0.08)]">
                        <div className="h-full bg-[rgba(120,80,200,0.20)]" style={{ width: `${externalData.walkScore.transitScore}%` }} />
                      </div>
                    </div>
                  )}
                  {externalData.walkScore.bikeScore != null && (
                    <div className="space-y-[2px]">
                      <p className="text-micro text-[--text-tertiary] tabular-nums">BIKE {externalData.walkScore.bikeScore}</p>
                      <div className="h-[2px] w-[60px] bg-[rgba(120,80,200,0.08)]">
                        <div className="h-full bg-[rgba(120,80,200,0.20)]" style={{ width: `${externalData.walkScore.bikeScore}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {externalData.walkScore.walkDescription && (
                  <p className="text-caption text-[--text-secondary]">{externalData.walkScore.walkDescription}</p>
                )}

                <div className="flex items-center justify-between pt-[var(--space-1)]">
                  <p className="text-micro text-[--text-ghost]">
                    UPDATED {formatUpdatedAt(externalData.walkScore.fetchedAt)}
                  </p>
                  <a
                    href="https://www.walkscore.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-micro text-[--text-ghost] hover:text-[--text-tertiary] transition-colors"
                  >
                    Walk Score&reg;
                  </a>
                </div>
              </div>
            )}

            {/* Safety */}
            {crimeData && crimeData.dataQuality !== 'unavailable' && (
              <div className="surface-1 p-[var(--space-5)] space-y-[var(--space-3)]">
                <p className="text-label text-[--text-ghost]">SAFETY (STATE)</p>
                {riskLevel && (
                  <p className={`text-heading font-light ${
                    riskLevel === 'LOW RISK' ? 'text-[--text-secondary]'
                    : riskLevel === 'HIGH RISK' ? 'text-[--vapor-pink]'
                    : 'text-[--text-primary]'
                  }`}>
                    {riskLevel}
                  </p>
                )}

                {crimeData.violentCrimeRate != null && (() => {
                  const diff = pctDiff(crimeData.violentCrimeRate, NATIONAL.violentCrime);
                  const barMax = Math.max(crimeData.violentCrimeRate, NATIONAL.violentCrime) * 1.3;
                  return (
                    <div className="space-y-[var(--space-1)]">
                      <div className="flex items-center justify-between">
                        <span className="text-micro text-[--text-tertiary] tabular-nums">
                          VIOLENT {formatRate(crimeData.violentCrimeRate)}/100K
                        </span>
                        <span className={`text-micro tabular-nums ${diff <= 0 ? 'text-[--text-secondary]' : 'text-[--text-tertiary]'}`}>
                          {diff > 0 ? '+' : ''}{diff}%
                        </span>
                      </div>
                      <div className="relative h-[3px] w-full bg-[rgba(120,80,200,0.08)]">
                        <div className="h-full bg-[#B36BFF99]" style={{ width: `${Math.min((crimeData.violentCrimeRate / barMax) * 100, 100)}%` }} />
                        <div className="absolute top-[-2px] h-[7px] w-[1px] bg-[#FF6B9D66]" style={{ left: `${Math.min((NATIONAL.violentCrime / barMax) * 100, 100)}%` }} />
                      </div>
                    </div>
                  );
                })()}

                {crimeData.propertyCrimeRate != null && (() => {
                  const diff = pctDiff(crimeData.propertyCrimeRate, NATIONAL.propertyCrime);
                  const barMax = Math.max(crimeData.propertyCrimeRate, NATIONAL.propertyCrime) * 1.3;
                  return (
                    <div className="space-y-[var(--space-1)]">
                      <div className="flex items-center justify-between">
                        <span className="text-micro text-[--text-tertiary] tabular-nums">
                          PROPERTY {formatRate(crimeData.propertyCrimeRate)}/100K
                        </span>
                        <span className={`text-micro tabular-nums ${diff <= 0 ? 'text-[--text-secondary]' : 'text-[--text-tertiary]'}`}>
                          {diff > 0 ? '+' : ''}{diff}%
                        </span>
                      </div>
                      <div className="relative h-[3px] w-full bg-[rgba(120,80,200,0.08)]">
                        <div className="h-full bg-[#B36BFF99]" style={{ width: `${Math.min((crimeData.propertyCrimeRate / barMax) * 100, 100)}%` }} />
                        <div className="absolute top-[-2px] h-[7px] w-[1px] bg-[#FF6B9D66]" style={{ left: `${Math.min((NATIONAL.propertyCrime / barMax) * 100, 100)}%` }} />
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between pt-[var(--space-1)]">
                  <p className="text-micro text-[--text-ghost]">
                    UPDATED {formatUpdatedAt(crimeData.fetchedAt)}
                  </p>
                  {crimeData.dataYear && (
                    <p className="text-micro text-[--text-ghost]">DATA YEAR {crimeData.dataYear}</p>
                  )}
                </div>
              </div>
            )}

            {/* Cost of Living */}
            {(() => {
              const cpiValue = externalData?.costOfLiving?.cpi?.value ?? null;
              const hasCost = medianRent != null || medianAnnualWage != null || cpiValue != null;
              if (!hasCost) return null;

              const rentData = externalData?.rentData;
              const runwayPct = medianRent != null && medianAnnualWage != null
                ? Math.round((medianRent / (medianAnnualWage / 12)) * 100)
                : null;

              return (
                <div className="surface-1 p-[var(--space-5)] space-y-[var(--space-3)]">
                  <p className="text-label text-[--text-ghost]">COST OF LIVING</p>

                  {medianRent != null && (
                    <div>
                      <p className="text-[28px] font-light text-[--text-primary] tabular-nums leading-none">
                        {formatDollars(medianRent)}
                        <span className="text-caption text-[--text-tertiary]"> /MO</span>
                      </p>
                      <p className="text-micro text-[--text-ghost] mt-[var(--space-1)] tabular-nums">
                        MEDIAN RENT, NATIONAL {formatDollars(NATIONAL.medianRent)}/MO
                      </p>
                    </div>
                  )}

                  {medianAnnualWage != null && (
                    <div>
                      <p className="text-caption text-[--text-secondary] tabular-nums">
                        MEDIAN WAGE {formatDollars(medianAnnualWage)}/YR
                      </p>
                      <p className="text-micro text-[--text-ghost] tabular-nums">
                        US MEDIAN {formatDollars(Math.round(NATIONAL.medianHourlyWage * 2080))}/YR
                      </p>
                    </div>
                  )}

                  {runwayPct != null && (
                    <p className="text-caption text-[--text-secondary]">
                      Rent is {runwayPct}% of monthly wage
                    </p>
                  )}

                  {(rentData?.fetchedAt || externalData?.costOfLiving?.wage?.fetchedAt) && (
                    <p className="text-micro text-[--text-ghost] pt-[var(--space-1)]">
                      UPDATED {formatUpdatedAt(
                        (rentData?.fetchedAt ?? externalData?.costOfLiving?.wage?.fetchedAt)!
                      )}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══ 3.5. NEIGHBORHOOD PULSE ═══ */}
        <NeighborhoodPulse neighborhoodId={id} />

        {/* ═══ 4. EVENTS: Horizontal scroll strip ═══ */}
        {externalData?.events && externalData.events.events.length > 0 && (
          <div className="animate-fade-up [animation-delay:120ms]">
            <p className="text-label text-[--text-ghost] mb-[var(--space-2)]">LOCAL EVENTS</p>
            <div className="flex gap-px overflow-x-auto pb-[var(--space-1)]">
              {externalData.events.events.map((event) => (
                <a
                  key={event.url}
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="surface-1 p-[var(--space-3)] min-w-[180px] max-w-[220px] shrink-0 hover:bg-[--bg-surface-2] transition-colors group"
                >
                  <p className="text-caption text-[--text-secondary] group-hover:text-[--text-primary] transition-colors truncate">
                    {event.name}
                  </p>
                  <div className="flex items-center gap-[var(--space-2)] mt-[var(--space-1)]">
                    <span className="text-micro text-[--text-ghost]">
                      {format(new Date(event.date), 'MMM d').toUpperCase()}
                    </span>
                    {event.isFree && (
                      <span className="text-micro text-[--vapor-pink] tracking-[0.12em]">FREE</span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
        {externalData?.events && externalData.events.events.length === 0 && externalData.events.upcomingEventCount === 0 && (
          <p className="text-micro text-[--text-tertiary] animate-fade-up [animation-delay:120ms]">
            No upcoming events tracked for this area
          </p>
        )}

        {/* ═══ 5. REVIEWS ═══ */}
        <div ref={reviewsSectionRef} className="animate-fade-up [animation-delay:150ms]">
          <p className="text-label text-[--text-ghost] mb-[var(--space-4)]">REVIEWS</p>

          {/* Two-column header: distribution + write/user review */}
          <div className="flex flex-col md:flex-row gap-[var(--space-5)]">
            {/* Left: Rating distribution */}
            <div className="md:w-1/2">
              <RatingDistributionChart neighborhoodId={neighborhood.id} />
            </div>

            {/* Right: Write review or user's existing review */}
            <div className="md:w-1/2">
              {session && userReview && !editingReview ? (
                <div className="surface-1 p-[var(--space-4)] space-y-[var(--space-3)]">
                  <p className="text-label text-[--text-ghost]">YOUR REVIEW</p>
                  <StarRating value={userReview.rating} readonly />
                  {userReview.comment && (
                    <p className="text-body text-[--text-secondary]">
                      &ldquo;{userReview.comment}&rdquo;
                    </p>
                  )}
                  <div className="flex gap-px pt-[var(--space-2)]">
                    <Button variant="ghost" size="sm" onClick={() => setEditingReview(true)}>
                      <PencilIcon className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReview.mutate({ id: userReview.id })}
                      disabled={deleteReview.isPending}
                    >
                      <Trash2Icon className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              ) : session && !showReviewForm && !editingReview ? (
                <div className="surface-1 p-[var(--space-4)] flex items-center justify-center h-full">
                  <Button onClick={() => setShowReviewForm(true)}>
                    WRITE A REVIEW
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Expanded review form */}
          {session && (showReviewForm || editingReview) && (
            <div className="surface-1 p-[var(--space-5)] mt-[var(--space-4)]">
              <p className="text-label text-[--text-ghost] mb-[var(--space-4)]">
                {editingReview ? 'EDIT YOUR REVIEW' : 'WRITE A REVIEW'}
              </p>
              <ReviewForm
                neighborhoodId={neighborhood.id}
                existingReview={editingReview && userReview ? userReview : undefined}
                onSuccess={() => {
                  setEditingReview(false);
                  setShowReviewForm(false);
                }}
              />
            </div>
          )}

          {/* Compact review list */}
          <div className="mt-[var(--space-4)]">
            <p className="text-micro text-[--text-ghost] mb-[var(--space-3)]">
              {neighborhood._count.reviews} REVIEW{neighborhood._count.reviews !== 1 ? 'S' : ''}
            </p>

            {neighborhood.reviews.length === 0 ? (
              <p className="text-body text-[--text-tertiary]">
                No reviews yet. Be the first.
              </p>
            ) : (
              <div>
                {neighborhood.reviews.map((review) => {
                  const isLong = (review.comment?.length ?? 0) > 120;
                  const isExpanded = expandedReviewIds.has(review.id);

                  return (
                    <div
                      key={review.id}
                      className="py-[var(--space-3)] border-t border-[--border-default]"
                    >
                      {/* Single-line header */}
                      <div className="flex items-center gap-[var(--space-2)]">
                        <Avatar className="h-6 w-6 rounded-full shrink-0">
                          <AvatarImage
                            src={review.user.image ?? undefined}
                            alt={review.user.name ?? 'User'}
                          />
                          <AvatarFallback className="rounded-full bg-[--bg-surface-2] text-[6px] tracking-[0.15em] text-[--text-tertiary]">
                            {getInitials(review.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <Link
                          href={`/users/${review.user.id}`}
                          className="text-caption text-[--text-secondary] hover:text-[--text-primary] transition-colors"
                        >
                          {review.user.name ?? 'Anonymous'}
                        </Link>
                        <StarRating value={review.rating} readonly />
                        <span className="text-micro text-[--text-ghost] ml-auto shrink-0">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>

                      {/* Comment with line clamp */}
                      {review.comment && (
                        <div className="mt-[var(--space-1)] pl-8">
                          <p className={`text-body text-[--text-secondary] ${isLong && !isExpanded ? 'line-clamp-2' : ''}`}>
                            {review.comment}
                          </p>
                          {isLong && (
                            <button
                              onClick={() => toggleReviewExpanded(review.id)}
                              className="text-micro text-[--text-ghost] hover:text-[--text-tertiary] transition-colors mt-[2px]"
                            >
                              {isExpanded ? 'SHOW LESS' : 'READ MORE'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ═══ 6. ABOUT ═══ */}
        {neighborhood.description && (
          <div className="surface-1 p-[var(--space-5)] animate-fade-up [animation-delay:180ms]">
            <p className="text-label text-[--text-ghost] mb-[var(--space-3)]">ABOUT</p>
            <p className="text-body text-[--text-secondary]">{neighborhood.description}</p>
          </div>
        )}

        {/* ═══ 7. SIMILAR NEIGHBORHOODS ═══ */}
        <SimilarNeighborhoods neighborhoodId={neighborhood.id} state={neighborhood.state} />
      </div>
    </DashboardLayout>
  );
}
