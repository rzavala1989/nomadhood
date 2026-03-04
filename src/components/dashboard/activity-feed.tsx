import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

import { StarRating } from '@/components/star-rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';
import { getInitials } from '@/utils/format';

export function ActivityFeed() {
  const { data: reviews, isLoading } = trpc.dashboard.getRecentActivity.useQuery({
    limit: 10,
  });

  if (isLoading) {
    return (
      <div className="space-y-px">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <p className="text-body text-[--text-tertiary] py-[var(--space-4)]">
        No recent activity yet.
      </p>
    );
  }

  return (
    <div>
      {reviews.map((review, i) => (
        <div
          key={review.id}
          className="flex gap-[var(--space-3)] py-[var(--space-3)] border-t border-black/[0.06] animate-fade-up"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <Avatar className="h-7 w-7 rounded-full shrink-0">
            <AvatarImage
              src={review.user.image ?? undefined}
              alt={review.user.name ?? 'User'}
            />
            <AvatarFallback className="rounded-full bg-[--bg-surface-2] text-[7px] tracking-[0.15em] text-[--text-tertiary]">
              {getInitials(review.user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-[var(--space-2)]">
              <span className="text-caption text-[--text-secondary] truncate">
                {review.user.name ?? 'Anonymous'}
              </span>
              <StarRating value={review.rating} readonly />
            </div>
            <Link
              href={`/neighborhoods/${review.neighborhood.id}`}
              className="text-caption text-[--text-tertiary] hover:text-[--text-primary] transition-colors truncate block"
            >
              {review.neighborhood.name}
            </Link>
            {review.comment && (
              <p className="text-caption text-[--text-ghost] truncate mt-[var(--space-1)]">
                &ldquo;{review.comment}&rdquo;
              </p>
            )}
          </div>
          <span className="text-micro text-[--text-ghost] shrink-0 mt-0.5">
            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
          </span>
        </div>
      ))}
    </div>
  );
}
