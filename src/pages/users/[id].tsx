import { useRouter } from 'next/router';
import Link from 'next/link';
import { format } from 'date-fns';
import { MapPinIcon } from 'lucide-react';

import { PageLayout } from '@/components/page-layout';
import { StarRating } from '@/components/star-rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';
import { getInitials } from '@/utils/format';

export default function PublicUserProfilePage() {
  const router = useRouter();
  const id = router.query.id as string;

  const { data: user, isLoading } = trpc.user.getPublicProfile.useQuery(
    { id },
    { enabled: !!id },
  );

  if (isLoading || !id) {
    return (
      <PageLayout title="Profile">
        <div className="p-[var(--space-6)] space-y-px">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout title="Not Found">
        <div className="flex flex-col items-center justify-center py-[var(--space-16)]">
          <p className="text-heading font-light text-[--text-secondary]">
            User not found.
          </p>
        </div>
      </PageLayout>
    );
  }

  const initials = getInitials(user.name);

  return (
    <PageLayout title={user.name ?? 'User'}>
      <div className="flex flex-col gap-[var(--space-8)] p-[var(--space-6)]">
        {/* Header */}
        <div className="surface-flat rounded-lg p-[var(--space-5)] animate-reveal">
          <div className="flex items-center gap-[var(--space-4)]">
            <Avatar className="h-14 w-14 rounded-full">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'User'} />
              <AvatarFallback className="rounded-full bg-[--bg-secondary] text-[11px] tracking-[0.15em] text-[--text-tertiary]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-heading font-light text-[--text-primary]">
                {user.name ?? 'Anonymous'}
              </p>
              <p className="text-micro text-[--text-ghost] mt-[var(--space-1)]">
                MEMBER SINCE {format(new Date(user.createdAt), 'MMM yyyy').toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex gap-[var(--space-8)] mt-[var(--space-4)] pt-[var(--space-3)] border-t border-[rgba(38,38,38,0.08)]">
            <div>
              <p className="text-micro text-[--text-ghost]">REVIEWS</p>
              <p className="text-[20px] font-light text-[--text-primary] tabular-nums">
                {user._count.reviews}
              </p>
            </div>
            <div>
              <p className="text-micro text-[--text-ghost]">FAVORITES</p>
              <p className="text-[20px] font-light text-[--text-primary] tabular-nums">
                {user._count.favorites}
              </p>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {user.reviews.length > 0 && (
          <div className="animate-reveal" style={{ animationDelay: '100ms' }}>
            <p className="text-label text-[--text-ghost] mb-[var(--space-4)]">
              {user._count.reviews} REVIEW{user._count.reviews !== 1 ? 'S' : ''}
            </p>
            <div>
              {user.reviews.map((review, i) => (
                <div
                  key={review.id}
                  className="flex gap-[var(--space-3)] py-[var(--space-3)] border-t border-[rgba(38,38,38,0.08)] animate-reveal"
                  style={{ animationDelay: `${150 + i * 40}ms` }}
                >
                  <div className="flex-1 space-y-[var(--space-1)]">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/neighborhoods/${review.neighborhood.id}`}
                        className="text-caption text-[--text-secondary] hover:text-[--text-primary] transition-colors"
                      >
                        {review.neighborhood.name}
                      </Link>
                      <span className="text-micro text-[--text-ghost]">
                        {format(new Date(review.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <StarRating value={review.rating} readonly />
                    {review.comment && (
                      <p className="text-body text-[--text-secondary] pt-[var(--space-1)]">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Favorites */}
        {user.favorites.length > 0 && (
          <div className="animate-reveal" style={{ animationDelay: '200ms' }}>
            <p className="text-label text-[--text-ghost] mb-[var(--space-4)]">
              {user._count.favorites} FAVORITE{user._count.favorites !== 1 ? 'S' : ''}
            </p>
            <div>
              {user.favorites.map((fav) => (
                <Link
                  key={fav.id}
                  href={`/neighborhoods/${fav.neighborhood.id}`}
                  className="flex items-center gap-[var(--space-3)] py-[10px] border-t border-[rgba(38,38,38,0.08)] transition-colors hover:bg-[--bg-root]"
                >
                  <MapPinIcon className="h-3.5 w-3.5 text-[--text-ghost]" />
                  <div>
                    <p className="text-body text-[--text-primary] font-medium">
                      {fav.neighborhood.name}
                    </p>
                    <p className="text-micro text-[--text-ghost]">
                      {fav.neighborhood.city}, {fav.neighborhood.state}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
