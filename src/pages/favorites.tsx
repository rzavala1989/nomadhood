import Link from 'next/link';
import { HeartIcon } from 'lucide-react';

import { DashboardLayout } from '@/components/dashboard-layout';
import { NeighborhoodCard } from '@/components/neighborhood-card';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';

export default function FavoritesPage() {
  const { data: favorites, isLoading } = trpc.favorites.getMine.useQuery();

  return (
    <DashboardLayout title="Favorites">
      <div className="flex flex-col gap-[var(--space-8)] py-[var(--space-6)]">
        <div className="px-[var(--space-6)]">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-px md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[180px] w-full" />
              ))}
            </div>
          ) : !favorites || favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-[var(--space-16)] text-center">
              <HeartIcon className="mb-[var(--space-4)] h-8 w-8 text-black/[0.12] stroke-[1]" />
              <p className="text-heading font-light text-[--text-secondary]">
                No favorites yet.
              </p>
              <p className="mt-[var(--space-2)] text-caption text-[--text-tertiary]">
                Start exploring and save neighborhoods you like.
              </p>
              <Link
                href="/neighborhoods"
                className="mt-[var(--space-6)] bg-[--bg-inverse] text-[--text-inverse] px-[var(--space-4)] py-[var(--space-2)] text-[10px] uppercase tracking-[0.18em] transition-all hover:bg-[#1A1A18]/90"
              >
                Browse Neighborhoods
              </Link>
            </div>
          ) : (
            <>
              <p className="text-micro text-[--text-ghost] mb-[var(--space-3)]">
                {favorites.length} SAVED
              </p>
              <div className="grid grid-cols-1 gap-px md:grid-cols-2 lg:grid-cols-3">
                {favorites.map((fav, i) => (
                  <div
                    key={fav.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <NeighborhoodCard
                      neighborhood={{
                        ...fav.neighborhood,
                        _count: {
                          reviews: 0,
                          favorites: 0,
                        },
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
