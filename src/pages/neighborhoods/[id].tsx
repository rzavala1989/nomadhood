import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PencilIcon, Trash2Icon } from 'lucide-react';

import { DashboardLayout } from '@/components/dashboard-layout';
import { FavoriteButton } from '@/components/favorite-button';
import { StarRating } from '@/components/star-rating';
import { ReviewForm } from '@/components/review-form';
import { RatingDistributionChart } from '@/components/rating-distribution-chart';
import { NeighborhoodMap } from '@/components/neighborhood-map-wrapper';
import { NeighborhoodCard } from '@/components/neighborhood-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { trpc } from '@/utils/trpc';

function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy');
}

export default function NeighborhoodDetailPage() {
  const router = useRouter();
  const id = router.query.id as string;
  const { data: session } = useSession();
  const [editingReview, setEditingReview] = useState(false);
  const utils = trpc.useUtils();

  const { data: neighborhood, isLoading } =
    trpc.neighborhoods.getById.useQuery({ id }, { enabled: !!id });

  const { data: userReview } = trpc.reviews.getUserReview.useQuery(
    { neighborhoodId: id },
    { enabled: !!id && !!session },
  );

  const deleteReview = trpc.reviews.delete.useMutation({
    onSuccess: () => {
      utils.reviews.getUserReview.invalidate({ neighborhoodId: id });
      utils.neighborhoods.getById.invalidate({ id });
      utils.getDashboardStats.invalidate();
      toast.success('Review deleted');
    },
    onError: () => {
      toast.error('Failed to delete review');
    },
  });

  if (isLoading || !id) {
    return (
      <DashboardLayout title="Neighborhood">
        <div className="space-y-px p-[var(--space-6)]">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="mt-[var(--space-4)] h-[200px] w-full" />
          <Skeleton className="mt-px h-[200px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!neighborhood) {
    return (
      <DashboardLayout title="Not Found">
        <div className="flex flex-col items-center justify-center py-[var(--space-16)]">
          <p className="text-heading font-light text-[--text-secondary]">
            Neighborhood not found.
          </p>
          <button
            onClick={() => router.push('/neighborhoods')}
            className="mt-[var(--space-4)] text-micro text-[--text-ghost] hover:text-[--text-secondary] transition-colors"
          >
            BACK TO NEIGHBORHOODS
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={neighborhood.name}>
      <div className="flex flex-col gap-[var(--space-8)] p-[var(--space-6)]">
        {/* Header */}
        <div className="flex items-start justify-between animate-fade-up">
          <div>
            <div className="flex items-center gap-[var(--space-3)]">
              <h2 className="text-title">{neighborhood.name}</h2>
              {neighborhood.nomadScore != null && neighborhood.nomadScore > 0 && (
                <div className="bg-[--bg-inverse] text-[--text-inverse] px-[var(--space-2)] py-[2px] text-[9px] tracking-[0.1em] tabular-nums self-start mt-[var(--space-1)]">
                  NOMAD {neighborhood.nomadScore}
                </div>
              )}
            </div>
            <div className="mt-[var(--space-3)] flex items-center gap-[var(--space-4)]">
              <span className="text-caption text-[--text-tertiary]">
                {neighborhood.city}, {neighborhood.state} {neighborhood.zip}
              </span>
              {neighborhood.avgRating !== null && (
                <div className="flex items-center gap-[var(--space-2)]">
                  <StarRating
                    value={Math.round(neighborhood.avgRating)}
                    readonly
                  />
                  <span className="text-caption text-[--text-tertiary] tabular-nums">
                    {neighborhood.avgRating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <FavoriteButton neighborhoodId={neighborhood.id} className="mt-2" />
        </div>

        {/* Map */}
        {neighborhood.latitude != null && neighborhood.longitude != null && (
          <div className="h-[240px] animate-fade-up" style={{ animationDelay: '60ms' }}>
            <NeighborhoodMap
              neighborhoods={[neighborhood]}
            />
          </div>
        )}

        {/* About */}
        {neighborhood.description && (
          <div className="surface-1 p-[var(--space-5)] animate-fade-up" style={{ animationDelay: '90ms' }}>
            <p className="text-label text-[--text-ghost] mb-[var(--space-3)]">ABOUT</p>
            <p className="text-body text-[--text-secondary]">{neighborhood.description}</p>
          </div>
        )}

        {/* Stats row */}
        <div className="flex gap-[var(--space-8)] animate-fade-up" style={{ animationDelay: '120ms' }}>
          <div>
            <p className="text-micro text-[--text-ghost]">REVIEWS</p>
            <p className="mt-[var(--space-1)] text-[20px] font-light text-[--text-primary] tabular-nums">
              {neighborhood._count.reviews}
            </p>
          </div>
          <div>
            <p className="text-micro text-[--text-ghost]">FAVORITES</p>
            <p className="mt-[var(--space-1)] text-[20px] font-light text-[--text-primary] tabular-nums">
              {neighborhood._count.favorites}
            </p>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="animate-fade-up" style={{ animationDelay: '150ms' }}>
          <RatingDistributionChart neighborhoodId={neighborhood.id} />
        </div>

        {/* Divider */}
        <div className="h-px bg-black/[0.06]" />

        {/* Review Form / User Review */}
        {session && (
          <div className="surface-1 p-[var(--space-5)] animate-fade-up" style={{ animationDelay: '180ms' }}>
            <p className="text-label text-[--text-ghost] mb-[var(--space-4)]">
              {userReview
                ? editingReview
                  ? 'EDIT YOUR REVIEW'
                  : 'YOUR REVIEW'
                : 'WRITE A REVIEW'}
            </p>

            {userReview && !editingReview ? (
              <div className="space-y-[var(--space-3)]">
                <StarRating value={userReview.rating} readonly />
                {userReview.comment && (
                  <p className="text-body text-[--text-secondary]">
                    &ldquo;{userReview.comment}&rdquo;
                  </p>
                )}
                <div className="flex gap-px pt-[var(--space-2)]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingReview(true)}
                  >
                    <PencilIcon className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteReview.mutate({ id: userReview.id })}
                    disabled={deleteReview.isPending}
                  >
                    <Trash2Icon className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <ReviewForm
                neighborhoodId={neighborhood.id}
                existingReview={
                  editingReview && userReview ? userReview : undefined
                }
                onSuccess={() => setEditingReview(false)}
              />
            )}
          </div>
        )}

        {/* All Reviews */}
        <div className="animate-fade-up" style={{ animationDelay: '240ms' }}>
          <p className="text-label text-[--text-ghost] mb-[var(--space-4)]">
            {neighborhood._count.reviews} REVIEW{neighborhood._count.reviews !== 1 ? 'S' : ''}
          </p>

          {neighborhood.reviews.length === 0 ? (
            <p className="text-body text-[--text-tertiary]">
              No reviews yet. Be the first.
            </p>
          ) : (
            <div>
              {neighborhood.reviews.map((review, i) => (
                <div
                  key={review.id}
                  className="flex gap-[var(--space-3)] py-[var(--space-4)] border-t border-black/[0.06] animate-fade-up"
                  style={{ animationDelay: `${300 + i * 60}ms` }}
                >
                  <Avatar className="h-8 w-8 rounded-full shrink-0">
                    <AvatarImage
                      src={review.user.image ?? undefined}
                      alt={review.user.name ?? 'User'}
                    />
                    <AvatarFallback className="rounded-full bg-[--bg-surface-2] text-[7px] tracking-[0.15em] text-[--text-tertiary]">
                      {(review.user.name ?? 'U')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-[var(--space-1)]">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/users/${review.user.id}`}
                        className="text-caption text-[--text-secondary] hover:text-[--text-primary] transition-colors"
                      >
                        {review.user.name ?? 'Anonymous'}
                      </Link>
                      <span className="text-micro text-[--text-ghost]">
                        {formatDate(review.createdAt)}
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
          )}
        </div>

        {/* Similar Neighborhoods */}
        <SimilarNeighborhoods neighborhoodId={neighborhood.id} state={neighborhood.state} />
      </div>
    </DashboardLayout>
  );
}

function SimilarNeighborhoods({ neighborhoodId, state }: { neighborhoodId: string; state: string }) {
  const { data: similar } = trpc.neighborhoods.getSimilar.useQuery(
    { id: neighborhoodId, limit: 4 },
    { enabled: !!neighborhoodId },
  );

  if (!similar || similar.length === 0) return null;

  return (
    <div className="animate-fade-up" style={{ animationDelay: '360ms' }}>
      <p className="text-label text-[--text-ghost] mb-[var(--space-4)]">
        SIMILAR IN {state}
      </p>
      <div className="grid grid-cols-1 gap-px md:grid-cols-2">
        {similar.map((n, i) => (
          <div key={n.id} className="animate-fade-up" style={{ animationDelay: `${400 + i * 60}ms` }}>
            <NeighborhoodCard neighborhood={n} />
          </div>
        ))}
      </div>
    </div>
  );
}
