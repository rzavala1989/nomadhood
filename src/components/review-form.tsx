import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/star-rating';
import { trpc } from '@/utils/trpc';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Select a rating').max(5),
  comment: z.string().max(1000).optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

type ExistingReview = {
  id: string;
  rating: number;
  comment: string | null;
};

export function ReviewForm({
  neighborhoodId,
  existingReview,
  onSuccess,
}: {
  neighborhoodId: string;
  existingReview?: ExistingReview | null;
  onSuccess?: () => void;
}) {
  const utils = trpc.useUtils();
  const isEdit = !!existingReview;
  const [rating, setRating] = useState(existingReview?.rating ?? 0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: existingReview?.rating ?? 0,
      comment: existingReview?.comment ?? '',
    },
  });

  const createReview = trpc.reviews.create.useMutation({
    onSuccess: () => {
      utils.reviews.getUserReview.invalidate({ neighborhoodId });
      utils.neighborhoods.getById.invalidate({ id: neighborhoodId });
      utils.getDashboardStats.invalidate();
      reset();
      setRating(0);
      onSuccess?.();
      toast.success('Review submitted');
    },
    onError: () => {
      toast.error('Failed to submit review');
    },
  });

  const updateReview = trpc.reviews.update.useMutation({
    onSuccess: () => {
      utils.reviews.getUserReview.invalidate({ neighborhoodId });
      utils.neighborhoods.getById.invalidate({ id: neighborhoodId });
      onSuccess?.();
      toast.success('Review updated');
    },
    onError: () => {
      toast.error('Failed to update review');
    },
  });

  const isPending = createReview.isPending || updateReview.isPending;

  const onSubmit = (values: ReviewFormValues) => {
    if (isEdit && existingReview) {
      updateReview.mutate({
        id: existingReview.id,
        rating: values.rating,
        comment: values.comment,
      });
    } else {
      createReview.mutate({
        neighborhoodId,
        rating: values.rating,
        comment: values.comment,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-[var(--space-4)]">
      <div>
        <p className="text-label text-[--text-label] mb-[var(--space-2)]">RATING</p>
        <StarRating
          value={rating}
          onChange={(val) => {
            setRating(val);
            reset((prev) => ({ ...prev, rating: val }));
          }}
        />
        {errors.rating && (
          <p className="mt-1 text-caption text-[--text-primary]">
            {errors.rating.message}
          </p>
        )}
      </div>
      <div>
        <p className="text-label text-[--text-label] mb-[var(--space-2)]">COMMENT</p>
        <Textarea
          placeholder="Share your experience..."
          {...register('comment')}
          rows={4}
        />
        {errors.comment && (
          <p className="mt-1 text-caption text-[--text-primary]">
            {errors.comment.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending
          ? 'Saving...'
          : isEdit
            ? 'Update Review'
            : 'Submit Review'}
      </Button>
    </form>
  );
}
