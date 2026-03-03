import Link from 'next/link';
import { MapPinIcon, StarIcon, HeartIcon, BarChart2Icon } from 'lucide-react';
import { trpc } from '../utils/trpc';
import type { NextPageWithLayout } from './_app';

const IndexPage: NextPageWithLayout = () => {
  const { data: me, isLoading: meLoading } = trpc.user.me.useQuery();
  const { data: stats } = trpc.getDashboardStats.useQuery();
  const { data: recent } = trpc.neighborhoods.list.useQuery({ limit: 6, sortBy: 'most_reviews' });

  return (
    <main className="min-h-screen bg-[--bg-root]">
      {/* Ambient grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-[var(--space-6)] py-[var(--space-16)]">

        {/* Nav strip */}
        <div className="mb-[var(--space-16)] flex items-center justify-between">
          <p className="text-[9px] uppercase tracking-[0.25em] text-[--text-ghost]">
            Nomadhood <span className="text-[--text-ghost] opacity-50">Beta</span>
          </p>
          <div className="flex items-center gap-px">
            <Link
              href="/neighborhoods"
              className="px-[var(--space-3)] py-[var(--space-2)] text-[9px] uppercase tracking-[0.18em] text-[--text-tertiary] transition-colors hover:text-[--text-secondary]"
            >
              Browse
            </Link>
            {!meLoading && (
              me ? (
                <Link
                  href="/dashboard"
                  className="bg-[--bg-surface-2] px-[var(--space-3)] py-[var(--space-2)] text-[9px] uppercase tracking-[0.18em] text-[--text-secondary] transition-colors hover:bg-[--bg-surface-3]"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/auth/signin"
                  className="bg-[--bg-inverse] px-[var(--space-3)] py-[var(--space-2)] text-[9px] uppercase tracking-[0.18em] text-[--text-inverse] transition-colors hover:opacity-90"
                >
                  Sign In / Sign Up
                </Link>
              )
            )}
          </div>
        </div>

        {/* Hero */}
        <div className="mb-[var(--space-16)] max-w-2xl space-y-[var(--space-6)]">
          <h1 className="text-display font-normal leading-none text-[--text-primary]">
            Know the<br />
            <em>neighborhood</em><br />
            before you move.
          </h1>
          <p className="text-body text-[--text-secondary] max-w-md leading-relaxed">
            Reviews, ratings, and maps from people who actually live there.
            Browse free. Save favorites and write reviews with a free account.
          </p>

          <div className="flex flex-wrap items-center gap-px pt-[var(--space-2)]">
            <Link
              href="/neighborhoods"
              className="bg-[--bg-inverse] text-[--text-inverse] px-[var(--space-6)] py-[var(--space-3)] text-[10px] uppercase tracking-[0.18em] transition-colors hover:opacity-90"
            >
              Browse Neighborhoods
            </Link>
            {!meLoading && !me && (
              <Link
                href="/auth/signin"
                className="surface-1 px-[var(--space-6)] py-[var(--space-3)] text-[10px] uppercase tracking-[0.18em] text-[--text-tertiary] transition-colors hover:text-[--text-secondary] hover:bg-[--bg-surface-2]"
              >
                Sign In / Sign Up
              </Link>
            )}
            {!meLoading && me && (
              <Link
                href="/dashboard"
                className="surface-1 px-[var(--space-6)] py-[var(--space-3)] text-[10px] uppercase tracking-[0.18em] text-[--text-tertiary] transition-colors hover:text-[--text-secondary] hover:bg-[--bg-surface-2]"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-[var(--space-16)] flex flex-wrap gap-[var(--space-8)]">
            {[
              { value: stats.neighborhoodCount, label: 'Neighborhoods' },
              { value: stats.reviewCount, label: 'Reviews' },
              { value: stats.userCount, label: 'Members' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-heading tabular-nums text-[--text-primary]">{value}</p>
                <p className="text-micro uppercase tracking-[0.18em] text-[--text-ghost]">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Feature grid */}
        <div className="mb-[var(--space-16)] grid grid-cols-2 gap-px sm:grid-cols-4">
          {[
            { icon: MapPinIcon, title: 'Interactive Map', desc: 'Browse on a live map with markers and popups' },
            { icon: StarIcon, title: 'Rated Reviews', desc: '1-5 star ratings and written reviews from residents' },
            { icon: HeartIcon, title: 'Save Favorites', desc: 'Build a shortlist and drag to reorder' },
            { icon: BarChart2Icon, title: 'Nomad Score', desc: 'Composite score ranking neighborhoods by data' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="surface-1 p-[var(--space-5)] space-y-[var(--space-2)]">
              <Icon className="h-4 w-4 text-[--text-ghost]" />
              <p className="text-caption text-[--text-secondary]">{title}</p>
              <p className="text-micro text-[--text-tertiary] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Neighborhood previews */}
        {recent && recent.neighborhoods.length > 0 && (
          <div className="space-y-[var(--space-4)]">
            <div className="flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-[0.25em] text-[--text-ghost]">
                Most Reviewed
              </p>
              <Link
                href="/neighborhoods"
                className="text-[9px] uppercase tracking-[0.18em] text-[--text-ghost] transition-colors hover:text-[--text-tertiary]"
              >
                View All
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3">
              {recent.neighborhoods.map((n) => (
                <Link
                  key={n.id}
                  href={`/neighborhoods/${n.id}`}
                  className="surface-1 group block p-[var(--space-5)] transition-colors hover:bg-[--bg-surface-2]"
                >
                  <div className="flex items-start justify-between gap-[var(--space-2)]">
                    <div className="min-w-0">
                      <p className="text-caption text-[--text-primary] truncate group-hover:text-[--text-primary]">
                        {n.name}
                      </p>
                      <p className="text-micro text-[--text-tertiary] mt-[2px]">
                        {n.city}, {n.state}
                      </p>
                    </div>
                    {n.nomadScore > 0 && (
                      <span className="shrink-0 bg-[--bg-surface-3] px-[var(--space-2)] py-[1px] text-[8px] tracking-[0.1em] text-[--text-ghost] tabular-nums">
                        {n.nomadScore}
                      </span>
                    )}
                  </div>
                  <div className="mt-[var(--space-3)] flex items-center gap-[var(--space-4)]">
                    <span className="text-micro text-[--text-ghost] tabular-nums">
                      {n._count.reviews} {n._count.reviews === 1 ? 'review' : 'reviews'}
                    </span>
                    {n.avgRating > 0 && (
                      <span className="text-micro text-[--text-ghost] tabular-nums">
                        {n.avgRating.toFixed(1)} avg
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-[var(--space-16)] flex items-center justify-between border-t border-[--border-subtle] pt-[var(--space-6)]">
          <p className="text-micro text-[--text-ghost] uppercase tracking-[0.18em]">Nomadhood</p>
          <p className="text-micro text-[--text-ghost]">v0.1.0</p>
        </div>
      </div>
    </main>
  );
};

export default IndexPage;
