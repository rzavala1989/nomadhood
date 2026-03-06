import { format } from 'date-fns';
import { trpc } from '@/utils/trpc';
import { NATIONAL, formatUpdatedAt, pctDiff, formatDollars, formatRate, getRiskLevel } from '@/components/neighborhood-data-utils';

function DiffBadge({ value, baseline, invert = false }: { value: number; baseline: number; invert?: boolean }) {
  const diff = pctDiff(value, baseline);
  if (diff === 0) return <span className="text-micro text-[--text-ghost] tabular-nums">AT NATIONAL AVG</span>;
  // invert: for crime/cost, lower is better so negative diff is positive
  const isGood = invert ? diff < 0 : diff > 0;
  return (
    <span className={`text-micro tabular-nums ${isGood ? 'text-[--text-secondary]' : 'text-[--text-tertiary]'}`}>
      {diff > 0 ? '+' : ''}{diff}% VS NATIONAL AVG
    </span>
  );
}

function ComparisonBar({ value, benchmark, max }: { value: number; benchmark: number; max: number }) {
  const valuePct = Math.min((value / max) * 100, 100);
  const benchPct = Math.min((benchmark / max) * 100, 100);
  return (
    <div className="relative h-[3px] w-full bg-[rgba(38,38,38,0.08)] rounded-full">
      <div
        className="h-full bg-[--accent-rose] rounded-full transition-all duration-500"
        style={{ width: `${valuePct}%` }}
      />
      {/* Benchmark tick */}
      <div
        className="absolute top-[-2px] h-[7px] w-[1px] bg-[--accent-rose]/40"
        style={{ left: `${benchPct}%` }}
      />
    </div>
  );
}

function WalkScoreCard({
  walkScore,
  transitScore,
  bikeScore,
  walkDescription,
  fetchedAt,
}: {
  walkScore: number | null;
  transitScore: number | null;
  bikeScore: number | null;
  walkDescription: string | null;
  fetchedAt: Date;
}) {
  return (
    <div className="surface-flat rounded-lg p-[var(--space-5)] space-y-[var(--space-3)]">
      <p className="text-label text-[--text-ghost]">WALKABILITY</p>

      {walkScore != null && (
        <>
          <div className="flex items-baseline gap-[var(--space-3)]">
            <p className="text-[28px] font-light text-[--text-primary] tabular-nums leading-none">
              {walkScore}
            </p>
            <DiffBadge value={walkScore} baseline={NATIONAL.walkScore} />
          </div>
          <ComparisonBar value={walkScore} benchmark={NATIONAL.walkScore} max={100} />
          <p className="text-micro text-[--text-ghost] tabular-nums">
            US AVG {NATIONAL.walkScore}
          </p>
        </>
      )}

      {walkDescription && (
        <p className="text-caption text-[--text-secondary]">{walkDescription}</p>
      )}

      <div className="flex gap-[var(--space-6)]">
        {transitScore != null && (
          <div>
            <span className="text-micro text-[--text-tertiary] tabular-nums">
              TRANSIT {transitScore}
            </span>
            <span className="text-micro text-[--text-ghost] tabular-nums ml-[var(--space-2)]">
              AVG {NATIONAL.transitScore}
            </span>
          </div>
        )}
        {bikeScore != null && (
          <div>
            <span className="text-micro text-[--text-tertiary] tabular-nums">
              BIKE {bikeScore}
            </span>
            <span className="text-micro text-[--text-ghost] tabular-nums ml-[var(--space-2)]">
              AVG {NATIONAL.bikeScore}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-[var(--space-1)]">
        <p className="text-micro text-[--text-ghost]">
          LAST UPDATED: {formatUpdatedAt(fetchedAt)}
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
  );
}

function RentDataCard({
  medianRent,
  medianRentSqft,
  medianSalePrice,
  medianSaleSqft,
  fetchedAt,
}: {
  medianRent: number | null;
  medianRentSqft: number | null;
  medianSalePrice: number | null;
  medianSaleSqft: number | null;
  fetchedAt: Date;
}) {
  const hasRent = medianRent != null;
  const hasSale = medianSalePrice != null;
  if (!hasRent && !hasSale) return null;

  return (
    <div className="surface-flat rounded-lg p-[var(--space-5)] space-y-[var(--space-3)]">
      <p className="text-label text-[--text-ghost]">HOUSING COST</p>

      {hasRent && (
        <div>
          <div className="flex items-baseline gap-[var(--space-3)]">
            <p className="text-[28px] font-light text-[--text-primary] tabular-nums leading-none">
              {formatDollars(medianRent)}{' '}
              <span className="text-caption text-[--text-tertiary]">/MO</span>
            </p>
            <DiffBadge value={medianRent} baseline={NATIONAL.medianRent} invert />
          </div>
          <p className="text-micro text-[--text-ghost] mt-[var(--space-1)] tabular-nums">
            MEDIAN RENT — NATIONAL MEDIAN {formatDollars(NATIONAL.medianRent)}/MO
          </p>
        </div>
      )}

      <div className="flex gap-[var(--space-6)]">
        {medianRentSqft != null && (
          <span className="text-micro text-[--text-tertiary] tabular-nums">
            ${medianRentSqft.toFixed(2)} /SQFT RENT
          </span>
        )}
        {medianSaleSqft != null && (
          <span className="text-micro text-[--text-tertiary] tabular-nums">
            ${medianSaleSqft.toFixed(0)} /SQFT SALE
          </span>
        )}
      </div>

      {hasSale && (
        <p className="text-caption text-[--text-secondary] tabular-nums">
          {formatDollars(medianSalePrice)} median sale price
        </p>
      )}

      <p className="text-micro text-[--text-ghost] pt-[var(--space-1)]">
        LAST UPDATED: {formatUpdatedAt(fetchedAt)}
      </p>
    </div>
  );
}

function CrimeRateRow({
  label,
  rate,
  nationalAvg,
}: {
  label: string;
  rate: number;
  nationalAvg: number;
}) {
  const diff = pctDiff(rate, nationalAvg);
  const barMax = Math.max(rate, nationalAvg) * 1.3;
  const ratePct = Math.min((rate / barMax) * 100, 100);
  const avgPct = Math.min((nationalAvg / barMax) * 100, 100);

  return (
    <div className="space-y-[var(--space-1)]">
      <div className="flex items-center justify-between">
        <span className="text-micro text-[--text-tertiary] tabular-nums">
          {label} {formatRate(rate)}/100K
        </span>
        <span className={`text-micro tabular-nums ${diff <= 0 ? 'text-[--text-secondary]' : 'text-[--text-tertiary]'}`}>
          {diff > 0 ? '+' : ''}{diff}%
        </span>
      </div>
      <div className="relative h-[3px] w-full bg-[rgba(38,38,38,0.08)] rounded-full">
        <div
          className="h-full bg-[--accent-rose] rounded-full transition-all duration-500"
          style={{ width: `${ratePct}%` }}
        />
        <div
          className="absolute top-[-2px] h-[7px] w-[1px] bg-[--accent-rose]/40"
          style={{ left: `${avgPct}%` }}
        />
      </div>
      <span className="text-micro text-[--text-ghost] tabular-nums">
        US AVG {formatRate(nationalAvg)}/100K
      </span>
    </div>
  );
}

function CrimeDataCard({
  violentCrimeRate,
  propertyCrimeRate,
  dataYear,
  dataQuality,
  fetchedAt,
}: {
  violentCrimeRate: number | null;
  propertyCrimeRate: number | null;
  dataYear: number | null;
  dataQuality: string;
  fetchedAt: Date;
}) {
  if (dataQuality === 'unavailable') return null;

  const riskLevel = getRiskLevel(violentCrimeRate, propertyCrimeRate);

  return (
    <div className="surface-flat rounded-lg p-[var(--space-5)] space-y-[var(--space-3)]">
      <p className="text-label text-[--text-ghost]">SAFETY (STATE)</p>

      {riskLevel && (
        <p className="text-heading font-light text-[--text-primary]">
          {riskLevel}
        </p>
      )}

      <div className="space-y-[var(--space-3)]">
        {violentCrimeRate != null && (
          <CrimeRateRow
            label="VIOLENT"
            rate={violentCrimeRate}
            nationalAvg={NATIONAL.violentCrime}
          />
        )}
        {propertyCrimeRate != null && (
          <CrimeRateRow
            label="PROPERTY"
            rate={propertyCrimeRate}
            nationalAvg={NATIONAL.propertyCrime}
          />
        )}
      </div>

      <div className="flex items-center justify-between pt-[var(--space-1)]">
        <p className="text-micro text-[--text-ghost]">
          LAST UPDATED: {formatUpdatedAt(fetchedAt)}
        </p>
        {dataYear && (
          <p className="text-micro text-[--text-ghost]">
            DATA YEAR {dataYear}
          </p>
        )}
      </div>
    </div>
  );
}

function CostOfLivingCard({
  cpiValue,
  cpiFetchedAt,
  wageValue,
  wageFetchedAt,
}: {
  cpiValue: number | null;
  cpiFetchedAt: Date | null;
  wageValue: number | null;
  wageFetchedAt: Date | null;
}) {
  if (cpiValue == null && wageValue == null) return null;

  const fetchedAt = cpiFetchedAt ?? wageFetchedAt;
  const medianAnnual = wageValue != null ? Math.round(wageValue * 2080) : null;
  const nationalAnnual = Math.round(NATIONAL.medianHourlyWage * 2080);

  return (
    <div className="surface-flat rounded-lg p-[var(--space-5)] space-y-[var(--space-3)]">
      <p className="text-label text-[--text-ghost]">COST OF LIVING</p>

      {cpiValue != null && (
        <div>
          <div className="flex items-baseline gap-[var(--space-3)]">
            <p className="text-[28px] font-light text-[--text-primary] tabular-nums leading-none">
              {pctDiff(cpiValue, NATIONAL.cpi) > 0 ? '+' : ''}{pctDiff(cpiValue, NATIONAL.cpi)}%
            </p>
            <span className="text-micro text-[--text-ghost]">
              VS NATIONAL AVG
            </span>
          </div>
          <ComparisonBar value={cpiValue} benchmark={NATIONAL.cpi} max={Math.max(cpiValue, NATIONAL.cpi) * 1.2} />
          <div className="flex items-center justify-between mt-[var(--space-1)]">
            <p className="text-micro text-[--text-ghost] tabular-nums">
              LOCAL CPI {cpiValue.toFixed(1)}
            </p>
            <p className="text-micro text-[--text-ghost] tabular-nums">
              US AVG {NATIONAL.cpi.toFixed(1)}
            </p>
          </div>
        </div>
      )}

      {medianAnnual != null && (
        <div className="space-y-[var(--space-1)]">
          <div className="flex items-baseline gap-[var(--space-3)]">
            <p className="text-caption text-[--text-secondary] tabular-nums">
              MEDIAN WAGE {formatDollars(medianAnnual)}/YR
            </p>
            <DiffBadge value={medianAnnual} baseline={nationalAnnual} />
          </div>
          <p className="text-micro text-[--text-ghost] tabular-nums">
            US MEDIAN {formatDollars(nationalAnnual)}/YR
          </p>
        </div>
      )}

      {wageValue != null && medianAnnual == null && (
        <p className="text-micro text-[--text-tertiary] tabular-nums">
          MEDIAN HOURLY ${wageValue.toFixed(2)} — US AVG ${NATIONAL.medianHourlyWage.toFixed(2)}
        </p>
      )}

      {fetchedAt && (
        <p className="text-micro text-[--text-ghost] pt-[var(--space-1)]">
          LAST UPDATED: {formatUpdatedAt(fetchedAt)}
        </p>
      )}
    </div>
  );
}

function EventsCard({
  upcomingEventCount,
  events,
  fetchedAt,
}: {
  upcomingEventCount: number;
  events: { name: string; date: string; url: string; isFree: boolean }[];
  fetchedAt: Date;
}) {
  return (
    <div className="surface-flat rounded-lg p-[var(--space-5)] space-y-[var(--space-3)]">
      <p className="text-label text-[--text-ghost]">LOCAL EVENTS</p>

      {upcomingEventCount > 0 ? (
        <p className="text-[28px] font-light text-[--text-primary] tabular-nums leading-none">
          {upcomingEventCount}{' '}
          <span className="text-caption text-[--text-tertiary]">UPCOMING</span>
        </p>
      ) : (
        <p className="text-caption text-[--text-tertiary]">
          No upcoming events tracked for this area
        </p>
      )}

      {events.length > 0 && (
        <div className="space-y-[var(--space-2)] pt-[var(--space-1)]">
          {events.slice(0, 3).map((event) => (
            <a
              key={event.url}
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <p className="text-caption text-[--text-secondary] group-hover:text-[--text-primary] transition-colors truncate">
                {event.name}
              </p>
              <div className="flex gap-[var(--space-3)]">
                <span className="text-micro text-[--text-ghost]">
                  {format(new Date(event.date), 'MMM d').toUpperCase()}
                </span>
                {event.isFree && (
                  <span className="text-micro text-[--text-tertiary]">FREE</span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}

      <p className="text-micro text-[--text-ghost] pt-[var(--space-1)]">
        LAST UPDATED: {formatUpdatedAt(fetchedAt)}
      </p>
    </div>
  );
}

export function NeighborhoodDataPanel({
  neighborhoodId,
  externalData,
}: {
  neighborhoodId: string;
  externalData?: {
    walkScore: Parameters<typeof WalkScoreCard>[0] | null;
    rentData: Parameters<typeof RentDataCard>[0] | null;
    crimeData: Parameters<typeof CrimeDataCard>[0] | null;
    costOfLiving: { cpi: { value: number | null; fetchedAt: Date } | null; wage: { value: number | null; fetchedAt: Date } | null };
    events: Parameters<typeof EventsCard>[0] | null;
  };
}) {
  const { data: fetched } = trpc.data.getAll.useQuery(
    { neighborhoodId },
    { enabled: !!neighborhoodId && externalData === undefined },
  );

  const data = externalData ?? fetched;

  if (!data) return null;

  const hasCostOfLiving =
    data.costOfLiving.cpi != null || data.costOfLiving.wage != null;
  const hasAnyData =
    data.walkScore != null ||
    data.rentData != null ||
    data.crimeData != null ||
    hasCostOfLiving ||
    data.events != null;
  if (!hasAnyData) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-reveal">
      {data.walkScore && (
        <WalkScoreCard
          walkScore={data.walkScore.walkScore}
          transitScore={data.walkScore.transitScore}
          bikeScore={data.walkScore.bikeScore}
          walkDescription={data.walkScore.walkDescription}
          fetchedAt={data.walkScore.fetchedAt}
        />
      )}
      {data.rentData && (
        <RentDataCard
          medianRent={data.rentData.medianRent}
          medianRentSqft={data.rentData.medianRentSqft}
          medianSalePrice={data.rentData.medianSalePrice}
          medianSaleSqft={data.rentData.medianSaleSqft}
          fetchedAt={data.rentData.fetchedAt}
        />
      )}
      {data.crimeData && (
        <CrimeDataCard
          violentCrimeRate={data.crimeData.violentCrimeRate}
          propertyCrimeRate={data.crimeData.propertyCrimeRate}
          dataYear={data.crimeData.dataYear}
          dataQuality={data.crimeData.dataQuality}
          fetchedAt={data.crimeData.fetchedAt}
        />
      )}
      {hasCostOfLiving && (
        <CostOfLivingCard
          cpiValue={data.costOfLiving.cpi?.value ?? null}
          cpiFetchedAt={data.costOfLiving.cpi?.fetchedAt ?? null}
          wageValue={data.costOfLiving.wage?.value ?? null}
          wageFetchedAt={data.costOfLiving.wage?.fetchedAt ?? null}
        />
      )}
      {data.events && (
        <EventsCard
          upcomingEventCount={data.events.upcomingEventCount}
          events={data.events.events}
          fetchedAt={data.events.fetchedAt}
        />
      )}
    </div>
  );
}
