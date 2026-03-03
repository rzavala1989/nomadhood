import { useState } from 'react';
import Link from 'next/link';
import { HeartIcon, GripVerticalIcon, MapPinIcon } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { toast } from 'sonner';

import { DashboardLayout } from '@/components/dashboard-layout';
import { FavoriteButton } from '@/components/favorite-button';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';

type FavoriteItem = {
  id: string;
  neighborhood: {
    id: string;
    name: string;
    city: string;
    state: string;
    description: string | null;
  };
};

function SortableFavoriteCard({ favorite }: { favorite: FavoriteItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: favorite.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="animate-fade-up">
      <div className={`surface-1 flex items-center gap-[var(--space-3)] p-[var(--space-4)] transition-all ${isDragging ? 'bg-[--bg-surface-2]' : ''}`}>
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-[--text-ghost] hover:text-[--text-tertiary] transition-colors touch-none"
        >
          <GripVerticalIcon className="h-4 w-4" />
        </button>

        <Link
          href={`/neighborhoods/${favorite.neighborhood.id}`}
          className="flex-1 min-w-0"
        >
          <div className="flex items-center gap-[var(--space-2)]">
            <MapPinIcon className="h-3.5 w-3.5 text-[--text-ghost] shrink-0" />
            <div className="min-w-0">
              <p className="text-body text-[--text-primary] font-medium truncate">
                {favorite.neighborhood.name}
              </p>
              <p className="text-micro text-[--text-ghost]">
                {favorite.neighborhood.city}, {favorite.neighborhood.state}
              </p>
            </div>
          </div>
          {favorite.neighborhood.description && (
            <p className="mt-[var(--space-2)] text-caption text-[--text-tertiary] line-clamp-1 ml-[22px]">
              {favorite.neighborhood.description}
            </p>
          )}
        </Link>

        <FavoriteButton neighborhoodId={favorite.neighborhood.id} />
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  const utils = trpc.useUtils();
  const { data: favorites, isLoading } = trpc.favorites.getMine.useQuery();
  const [localOrder, setLocalOrder] = useState<FavoriteItem[] | null>(null);

  const reorder = trpc.favorites.reorder.useMutation({
    onSuccess: () => {
      utils.favorites.getMine.invalidate();
      toast.success('Order saved');
    },
    onError: () => toast.error('Failed to save order'),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const items = localOrder ?? favorites ?? [];

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !favorites) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);

    setLocalOrder(reordered);
    reorder.mutate({ orderedIds: reordered.map((i) => i.id) });
  }

  return (
    <DashboardLayout title="Favorites">
      <div className="flex flex-col gap-[var(--space-8)] py-[var(--space-6)]">
        <div className="px-[var(--space-6)]">
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[72px] w-full" />
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
              <div className="flex items-center justify-between mb-[var(--space-3)]">
                <p className="text-micro text-[--text-ghost]">
                  {favorites.length} SAVED — DRAG TO REORDER
                </p>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-px">
                    {items.map((fav) => (
                      <SortableFavoriteCard key={fav.id} favorite={fav} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
