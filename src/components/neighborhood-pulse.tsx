import { formatDistanceToNowStrict } from 'date-fns';
import { trpc } from '@/utils/trpc';

const SIGNAL_COLORS: Record<string, string> = {
  Safety: 'bg-[--accent-rose]',
  Infrastructure: 'bg-[--accent-rose]',
  'Cost of Living': 'bg-[--accent-rose]',
  'Food and Culture': 'bg-[rgba(38,38,38,0.22)]',
  'Tech and Coworking': 'bg-[rgba(38,38,38,0.22)]',
  Community: 'bg-[rgba(38,38,38,0.22)]',
};

function TrendArrow({ direction }: { direction: 'improving' | 'declining' | 'stable' }) {
  if (direction === 'improving') return <span className="text-[--text-secondary]">&#x25B2;</span>;
  if (direction === 'declining') return <span className="text-[--accent-rose]">&#x25BC;</span>;
  return <span className="text-[--text-ghost]">&#x25CF;</span>;
}

export function NeighborhoodPulse({ neighborhoodId }: { neighborhoodId: string }) {
  const { data: pulse, isLoading } = trpc.news.getPulse.useQuery(
    { neighborhoodId },
    { enabled: !!neighborhoodId },
  );

  if (isLoading) return null;

  if (!pulse || pulse.articleCount === 0) {
    return (
      <div className="animate-reveal [animation-delay:105ms]">
        <p className="text-label text-[--text-ghost] mb-[var(--space-2)]">NEIGHBORHOOD PULSE</p>
        <p className="text-micro text-[--text-tertiary]">
          No recent news coverage for this neighborhood
        </p>
      </div>
    );
  }

  const sentimentPct = Math.round(pulse.sentimentScore * 100);
  const isPositive = pulse.sentimentScore >= 0;
  const categories = Object.entries(pulse.articles);

  return (
    <div className="animate-reveal [animation-delay:105ms]">
      <p className="text-label text-[--text-ghost] mb-[var(--space-2)]">NEIGHBORHOOD PULSE</p>

      {/* Top bar: sentiment + trend */}
      <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-3)]">
        <div
          className={`px-[var(--space-3)] py-[4px] text-[10px] tracking-[0.12em] tabular-nums rounded-full ${
            isPositive ? 'bg-[--accent-rose] text-[--accent-charcoal]' : 'surface-flat text-[--text-secondary]'
          }`}
        >
          SENTIMENT {sentimentPct > 0 ? '+' : ''}{sentimentPct}%
        </div>
        <div className="flex items-center gap-[var(--space-1)]">
          <TrendArrow direction={pulse.trendDirection} />
          <span className="text-micro text-[--text-ghost] tracking-[0.12em] uppercase">
            {pulse.trendDirection}
          </span>
        </div>
        <span className="text-micro text-[--text-ghost] tabular-nums ml-auto">
          {pulse.articleCount} ARTICLE{pulse.articleCount !== 1 ? 'S' : ''}
        </span>
      </div>

      {/* Articles grouped by signal category */}
      <div className="space-y-[var(--space-3)]">
        {categories.map(([category, articles]) => (
          <div key={category}>
            <p className="text-label text-[--text-ghost] mb-[var(--space-1)]">{category.toUpperCase()}</p>
            <div>
              {articles.map((article, i) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-[var(--space-2)] py-[var(--space-2)] border-t border-[rgba(38,38,38,0.06)] hover:bg-[--bg-secondary] transition-colors animate-reveal"
                  style={{ animationDelay: `${(i + 1) * 30}ms` }}
                >
                  {/* Signal dot */}
                  <span
                    className={`mt-[5px] h-[6px] w-[6px] shrink-0 rounded-full ${SIGNAL_COLORS[category] ?? 'bg-[rgba(38,38,38,0.22)]'}`}
                  />

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-[var(--space-2)]">
                      <p className="text-caption text-[--text-secondary] truncate flex-1">
                        {article.title}
                      </p>
                      <span className="text-micro text-[--text-ghost] shrink-0 tabular-nums">
                        {article.sourceId && (
                          <>{article.sourceId} &middot; </>
                        )}
                        {formatDistanceToNowStrict(new Date(article.pubDate), { addSuffix: true })}
                      </span>
                    </div>
                    {article.description && (
                      <p className="text-micro text-[--text-ghost] line-clamp-2 mt-[2px]">
                        {article.description}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
