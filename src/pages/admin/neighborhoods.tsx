import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';

const neighborhoodSchema = z.object({
  name: z.string().min(1).max(100),
  city: z.string().min(1).max(50),
  state: z.string().length(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  description: z.string().max(1000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

type FormValues = z.infer<typeof neighborhoodSchema>;

function NeighborhoodForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel,
}: {
  defaultValues?: Partial<FormValues>;
  onSubmit: (values: FormValues) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(neighborhoodSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-[var(--space-3)]">
      <div className="grid grid-cols-2 gap-[var(--space-3)]">
        <div>
          <p className="text-label text-[--text-label] mb-1">NAME</p>
          <Input {...register('name')} placeholder="Neighborhood name" />
          {errors.name && <p className="text-micro text-[--text-primary] mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <p className="text-label text-[--text-label] mb-1">CITY</p>
          <Input {...register('city')} placeholder="City" />
        </div>
        <div>
          <p className="text-label text-[--text-label] mb-1">STATE</p>
          <Input {...register('state')} placeholder="CA" maxLength={2} />
        </div>
        <div>
          <p className="text-label text-[--text-label] mb-1">ZIP</p>
          <Input {...register('zip')} placeholder="90210" />
        </div>
        <div>
          <p className="text-label text-[--text-label] mb-1">LATITUDE</p>
          <Input {...register('latitude', { valueAsNumber: true })} type="number" step="any" placeholder="34.0522" />
        </div>
        <div>
          <p className="text-label text-[--text-label] mb-1">LONGITUDE</p>
          <Input {...register('longitude', { valueAsNumber: true })} type="number" step="any" placeholder="-118.2437" />
        </div>
      </div>
      <div>
        <p className="text-label text-[--text-label] mb-1">DESCRIPTION</p>
        <Textarea {...register('description')} placeholder="Describe this neighborhood..." rows={3} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}

export default function AdminNeighborhoodsPage() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.neighborhoods.list.useQuery({ limit: 100 });
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const createMutation = trpc.neighborhoods.create.useMutation({
    onSuccess: () => {
      utils.neighborhoods.list.invalidate();
      setShowCreate(false);
      toast.success('Neighborhood created');
    },
    onError: () => toast.error('Failed to create neighborhood'),
  });

  const updateMutation = trpc.neighborhoods.update.useMutation({
    onSuccess: () => {
      utils.neighborhoods.list.invalidate();
      setEditId(null);
      toast.success('Neighborhood updated');
    },
    onError: () => toast.error('Failed to update neighborhood'),
  });

  const deleteMutation = trpc.neighborhoods.delete.useMutation({
    onSuccess: () => {
      utils.neighborhoods.list.invalidate();
      toast.success('Neighborhood deleted');
    },
    onError: () => toast.error('Failed to delete neighborhood'),
  });

  return (
    <AdminLayout title="Admin — Neighborhoods">
      <div className="flex items-center justify-between mb-[var(--space-4)]">
        <p className="text-micro text-[--text-ghost]">
          {data?.pagination.total ?? 0} NEIGHBORHOODS
        </p>
        <Button
          size="sm"
          onClick={() => { setShowCreate(!showCreate); setEditId(null); }}
        >
          <PlusIcon className="mr-1 h-3 w-3" />
          Create
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="surface-1 p-[var(--space-5)] mb-[var(--space-4)] animate-fade-up">
          <p className="text-label text-[--text-ghost] mb-[var(--space-3)]">NEW NEIGHBORHOOD</p>
          <NeighborhoodForm
            onSubmit={(values) => createMutation.mutate(values)}
            isPending={createMutation.isPending}
            submitLabel="Create Neighborhood"
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-px">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="surface-1">
          <div className="grid grid-cols-[1fr_100px_50px_60px_60px_80px] gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-2)] border-b border-black/[0.06]">
            <span className="text-micro text-[--text-ghost]">NAME</span>
            <span className="text-micro text-[--text-ghost]">LOCATION</span>
            <span className="text-micro text-[--text-ghost]">STATE</span>
            <span className="text-micro text-[--text-ghost]">REVIEWS</span>
            <span className="text-micro text-[--text-ghost]">FAVS</span>
            <span className="text-micro text-[--text-ghost]">ACTIONS</span>
          </div>

          {data?.neighborhoods.map((n, i) => (
            <div key={n.id}>
              <div
                className="grid grid-cols-[1fr_100px_50px_60px_60px_80px] gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] border-b border-black/[0.06] animate-fade-up items-center"
                style={{ animationDelay: `${i * 20}ms` }}
              >
                <span className="text-body text-[--text-primary] truncate">{n.name}</span>
                <span className="text-caption text-[--text-secondary] truncate">{n.city}</span>
                <span className="text-caption text-[--text-tertiary]">{n.state}</span>
                <span className="text-caption text-[--text-tertiary] tabular-nums">{n._count.reviews}</span>
                <span className="text-caption text-[--text-tertiary] tabular-nums">{n._count.favorites}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditId(editId === n.id ? null : n.id)}
                  >
                    <PencilIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete "${n.name}"? This cannot be undone.`)) {
                        deleteMutation.mutate({ id: n.id });
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2Icon className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Inline edit form */}
              {editId === n.id && (
                <div className="px-[var(--space-4)] py-[var(--space-4)] bg-[--bg-surface-1] border-b border-black/[0.06] animate-fade-up">
                  <p className="text-label text-[--text-ghost] mb-[var(--space-3)]">EDIT NEIGHBORHOOD</p>
                  <NeighborhoodForm
                    defaultValues={{
                      name: n.name,
                      city: n.city,
                      state: n.state,
                      zip: n.zip,
                      description: n.description ?? '',
                      latitude: n.latitude ?? undefined,
                      longitude: n.longitude ?? undefined,
                    }}
                    onSubmit={(values) => updateMutation.mutate({ id: n.id, ...values })}
                    isPending={updateMutation.isPending}
                    submitLabel="Update"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
