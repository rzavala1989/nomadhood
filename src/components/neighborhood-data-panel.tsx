import { format } from 'date-fns';
import { trpc } from '@/utils/trpc';

function formatUpdatedAt(date: Date) {
  return format(new Date(date), 'MMM d, yyyy').toUpperCase();
}

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-[3px] w-full bg-white/[0.08]">
      <div
        className="h-full bg-white/[0.30] transition-all duration-500"
        style={{ width: `${pct}%` }}
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
    <div className="surface-1 p-[var(--space-5)] space-y-[var(--space-3)]">
      <p className="text-label text-[--text-ghost]">WALKABILITY</p>

      {walkScore != null && (
        <>
          <p className="text-[28px] font-light text-[--text-primary] tabular-nums leading-none">
            {walkScore}
          </p>
          <ScoreBar value={walkScore} />
        </>
      )}

      <div className="flex gap-[var(--space-6)]">
        {transitScore != null && (
          <span className="text-micro text-[--text-tertiary] tabular-nums">
            TRANSIT {transitScore}
          </span>
        )}
        {bikeScore != null && (
          <span className="text-micro text-[--text-tertiary] tabular-nums">
            BIKE {bikeScore}
          </span>
        )}
      </div>

      {walkDescription && (
        <p className="text-caption text-[--text-secondary]">{walkDescription}</p>
      )}

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

function formatDollars(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
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
    <div className="surface-1 p-[var(--space-5)] space-y-[var(--space-3)]">
      <p className="text-label text-[--text-ghost]">HOUSING COST</p>

      {hasRent && (
        <div>
          <p className="text-[28px] font-light text-[--text-primary] tabular-nums leading-none">
            {formatDollars(medianRent)}{' '}
            <span className="text-caption text-[--text-tertiary]">/MO</span>
          </p>
          <p className="text-micro text-[--text-ghost] mt-[var(--space-1)]">
            MEDIAN RENT
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

function getRiskLevel(violentRate: number | null, propertyRate: number | null) {
  // Based on FBI national averages: violent ~380/100k, property ~2,000/100k
  if (violentRate == null && propertyRate == null) return null;
  const v = violentRate ?? 0;
  const p = propertyRate ?? 0;
  if (v < 200 && p < 1500) return 'LOW RISK';
  if (v < 400 && p < 2500) return 'MODERATE';
  return 'HIGH RISK';
}

function formatRate(rate: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(rate);
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
    <div className="surface-1 p-[var(--space-5)] space-y-[var(--space-3)]">
      <p className="text-label text-[--text-ghost]">SAFETY</p>

      {riskLevel && (
        <p className="text-heading font-light text-[--text-primary]">
          {riskLevel}
        </p>
      )}

      <div className="space-y-[var(--space-1)]">
        {violentCrimeRate != null && (
          <p className="text-micro text-[--text-tertiary] tabular-nums">
            VIOLENT {formatRate(violentCrimeRate)}/100K
          </p>
        )}
        {propertyCrimeRate != null && (
          <p className="text-micro text-[--text-tertiary] tabular-nums">
            PROPERTY {formatRate(propertyCrimeRate)}/100K
          </p>
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
  // CPI values are index numbers; compute YoY-style display
  // For now, show the raw index value since we'd need two data points for YoY
  const medianAnnual = wageValue != null ? Math.round(wageValue * 2080) : null;

  return (
    <div className="surface-1 p-[var(--space-5)] space-y-[var(--space-3)]">
      <p className="text-label text-[--text-ghost]">COST OF LIVING</p>

      {cpiValue != null && (
        <div>
          <p className="text-[28px] font-light text-[--text-primary] tabular-nums leading-none">
            {cpiValue.toFixed(1)}
          </p>
          <p className="text-micro text-[--text-ghost] mt-[var(--space-1)]">
            CPI INDEX
          </p>
        </div>
      )}

      {medianAnnual != null && (
        <p className="text-micro text-[--text-tertiary] tabular-nums">
          MEDIAN WAGE {formatDollars(medianAnnual)}/YR
        </p>
      )}

      {wageValue != null && medianAnnual == null && (
        <p className="text-micro text-[--text-tertiary] tabular-nums">
          MEDIAN HOURLY ${wageValue.toFixed(2)}
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

export function NeighborhoodDataPanel({
  neighborhoodId,
}: {
  neighborhoodId: string;
}) {
  const { data } = trpc.data.getAll.useQuery(
    { neighborhoodId },
    { enabled: !!neighborhoodId },
  );

  if (!data) return null;

  const hasCostOfLiving =
    data.costOfLiving.cpi != null || data.costOfLiving.wage != null;
  const hasAnyData =
    data.walkScore != null ||
    data.rentData != null ||
    data.crimeData != null ||
    hasCostOfLiving;
  if (!hasAnyData) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-px animate-fade-up">
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
    </div>
  );
}
