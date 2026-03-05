import { HeartIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { trpc } from '@/utils/trpc';

export function FavoriteButton({
  neighborhoodId,
  className,
}: {
  neighborhoodId: string;
  className?: string;
}) {
  const { data: session } = useSession();
  const utils = trpc.useUtils();

  const { data } = trpc.favorites.isFavorite.useQuery(
    { neighborhoodId },
    { enabled: !!session },
  );

  const toggle = trpc.favorites.toggle.useMutation({
    onSuccess: (data) => {
      utils.favorites.isFavorite.invalidate({ neighborhoodId });
      utils.favorites.getMine.invalidate();
      utils.dashboard.getStats.invalidate();
      toast.success(data.added ? 'Saved to favorites' : 'Removed from favorites');
    },
    onError: () => {
      toast.error('Failed to update favorite');
    },
  });

  if (!session) return null;

  const isFavorite = data?.isFavorite ?? false;

  return (
    <button
      className={cn(
        'p-1 transition-all hover:scale-110',
        className,
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle.mutate({ neighborhoodId });
      }}
      disabled={toggle.isPending}
    >
      <HeartIcon
        className={cn(
          'h-4 w-4 transition-all duration-300',
          isFavorite ? 'fill-[--vapor-pink] text-[--vapor-pink]' : 'text-[rgba(120,80,200,0.15)]',
        )}
      />
    </button>
  );
}
