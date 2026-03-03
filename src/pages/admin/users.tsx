import { format } from 'date-fns';
import { ShieldIcon, ShieldOffIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { AdminLayout } from '@/components/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';

export default function AdminUsersPage() {
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.user.getAll.useQuery();

  const promote = trpc.user.promote.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate();
      toast.success('User promoted to admin');
    },
    onError: () => toast.error('Failed to promote user'),
  });

  const demote = trpc.user.demote.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate();
      toast.success('Admin privileges removed');
    },
    onError: () => toast.error('Failed to demote user'),
  });

  const deleteUser = trpc.user.delete.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate();
      toast.success('User deleted');
    },
    onError: () => toast.error('Failed to delete user'),
  });

  return (
    <AdminLayout title="Admin — Users">
      {isLoading ? (
        <div className="space-y-px">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <>
          <p className="text-micro text-[--text-ghost] mb-[var(--space-4)]">
            {users?.length ?? 0} USERS
          </p>

          <div className="surface-1">
            <div className="grid grid-cols-[1fr_1fr_80px_100px_120px] gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-2)] border-b border-black/[0.06]">
              <span className="text-micro text-[--text-ghost]">NAME</span>
              <span className="text-micro text-[--text-ghost]">EMAIL</span>
              <span className="text-micro text-[--text-ghost]">ROLE</span>
              <span className="text-micro text-[--text-ghost]">JOINED</span>
              <span className="text-micro text-[--text-ghost]">ACTIONS</span>
            </div>

            {users?.map((user, i) => (
              <div
                key={user.id}
                className="grid grid-cols-[1fr_1fr_80px_100px_120px] gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] border-b border-black/[0.06] animate-fade-up items-center"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <span className="text-body text-[--text-primary] truncate">
                  {user.name ?? '—'}
                </span>
                <span className="text-caption text-[--text-secondary] truncate">
                  {user.email}
                </span>
                <div>
                  {user.isAdmin ? (
                    <Badge variant="default">Admin</Badge>
                  ) : (
                    <Badge variant="secondary">User</Badge>
                  )}
                </div>
                <span className="text-micro text-[--text-ghost]">
                  {format(new Date(user.createdAt), 'MMM d, yy')}
                </span>
                <div className="flex gap-1">
                  {user.isAdmin ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => demote.mutate({ userId: user.id })}
                      disabled={demote.isPending}
                    >
                      <ShieldOffIcon className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => promote.mutate({ userId: user.id })}
                      disabled={promote.isPending}
                    >
                      <ShieldIcon className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this user? This cannot be undone.')) {
                        deleteUser.mutate({ userId: user.id });
                      }
                    }}
                    disabled={deleteUser.isPending}
                  >
                    <Trash2Icon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
