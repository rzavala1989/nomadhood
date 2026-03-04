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

  const hasAnyData = data.walkScore != null;
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
    </div>
  );
}
