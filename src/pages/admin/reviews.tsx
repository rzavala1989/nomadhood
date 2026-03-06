import { format } from 'date-fns';
import { Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { AdminLayout } from '@/components/admin-layout';
import { StarRating } from '@/components/star-rating';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';

export default function AdminReviewsPage() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.reviews.adminGetAll.useQuery({ limit: 50 });

  const adminDelete = trpc.reviews.adminDelete.useMutation({
    onSuccess: () => {
      utils.reviews.adminGetAll.invalidate();
      toast.success('Review deleted');
    },
    onError: () => toast.error('Failed to delete review'),
  });

  return (
    <AdminLayout title="Admin — Reviews">
      {isLoading ? (
        <div className="space-y-px">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <>
          <p className="text-micro text-[--text-ghost] mb-[var(--space-4)]">
            {data?.pagination.total ?? 0} REVIEWS
          </p>

          <div className="surface-flat rounded-lg">
            <div className="grid grid-cols-[120px_1fr_80px_1fr_80px_60px] gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-2)] border-b border-[rgba(38,38,38,0.08)]">
              <span className="text-micro text-[--text-ghost]">USER</span>
              <span className="text-micro text-[--text-ghost]">NEIGHBORHOOD</span>
              <span className="text-micro text-[--text-ghost]">RATING</span>
              <span className="text-micro text-[--text-ghost]">COMMENT</span>
              <span className="text-micro text-[--text-ghost]">DATE</span>
              <span className="text-micro text-[--text-ghost]">ACTION</span>
            </div>

            {data?.reviews.map((review, i) => (
              <div
                key={review.id}
                className="grid grid-cols-[120px_1fr_80px_1fr_80px_60px] gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] border-b border-[rgba(38,38,38,0.08)] animate-reveal items-center"
                style={{ animationDelay: `${i * 20}ms` }}
              >
                <span className="text-caption text-[--text-secondary] truncate">
                  {review.user.name ?? review.user.email}
                </span>
                <Link
                  href={`/neighborhoods/${review.neighborhood.id}`}
                  className="text-caption text-[--text-secondary] truncate hover:text-[--text-primary] transition-colors"
                >
                  {review.neighborhood.name}
                </Link>
                <div>
                  <StarRating value={review.rating} readonly />
                </div>
                <span className="text-caption text-[--text-tertiary] truncate">
                  {review.comment || '—'}
                </span>
                <span className="text-micro text-[--text-ghost]">
                  {format(new Date(review.createdAt), 'MMM d, yy')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Delete this review?')) {
                      adminDelete.mutate({ id: review.id });
                    }
                  }}
                  disabled={adminDelete.isPending}
                >
                  <Trash2Icon className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
