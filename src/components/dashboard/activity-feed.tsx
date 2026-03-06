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
      <div className="space-y-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[48px] w-full" />
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
        <Link
          key={review.id}
          href={`/neighborhoods/${review.neighborhood.id}`}
          className="flex items-center gap-[var(--space-3)] h-[48px] px-[var(--space-2)] border-t border-[rgba(38,38,38,0.06)] hover:bg-[--bg-secondary] transition-colors animate-reveal"
          style={{ animationDelay: `${i * 30}ms` }}
        >
          <Avatar className="h-8 w-8 rounded-full shrink-0">
            <AvatarImage
              src={review.user.image ?? undefined}
              alt={review.user.name ?? 'User'}
            />
            <AvatarFallback className="rounded-full bg-[--bg-secondary] text-[7px] tracking-[0.15em] text-[--text-tertiary]">
              {getInitials(review.user.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-[var(--space-2)]">
              <span className="text-caption text-[--text-secondary] truncate">
                {review.user.name ?? 'Anonymous'}
              </span>
              <span className="text-micro text-[--text-ghost] truncate shrink-[2]">
                {review.neighborhood.name}
              </span>
            </div>
            {/* Snippet slot: always occupies space for uniform height */}
            <p className="text-micro text-[--text-ghost] truncate h-[14px]">
              {review.comment ? `\u201C${review.comment}\u201D` : '\u00A0'}
            </p>
          </div>

          <StarRating value={review.rating} readonly />

          <span className="text-micro text-[--text-ghost] shrink-0 tabular-nums">
            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
          </span>
        </Link>
      ))}
    </div>
  );
}
