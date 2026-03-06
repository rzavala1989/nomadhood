import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { MapPinIcon, HeartIcon, ArrowRightIcon } from 'lucide-react';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { trpc } from '@/utils/trpc';

export default function ProfilePage() {
  const utils = trpc.useUtils();
  const { data: user, isLoading } = trpc.user.me.useQuery();
  const { data: favorites } = trpc.favorites.getMine.useQuery();

  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [initialized, setInitialized] = useState(false);

  if (user && !initialized) {
    setName(user.name ?? '');
    setImage(user.image ?? '');
    setInitialized(true);
  }

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      utils.user.me.invalidate();
      toast.success('Profile updated');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleSave = () => {
    updateProfile.mutate({
      name: name || undefined,
      image: image || undefined,
    });
  };

  return (
    <DashboardLayout title="Profile">
      <div className="flex flex-col gap-[var(--space-10)] p-[var(--space-6)]">
        {isLoading ? (
          <div className="space-y-px">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : (
          <>
            {/* User Info */}
            <div className="surface-flat rounded-lg p-[var(--space-5)] animate-reveal">
              <p className="text-label text-[--text-ghost] mb-[var(--space-4)]">PROFILE</p>

              <div className="flex items-center gap-[var(--space-4)] mb-[var(--space-6)]">
                <Avatar className="h-14 w-14 rounded-full">
                  <AvatarImage src={image} alt={name} />
                  <AvatarFallback className="rounded-full bg-[--bg-secondary] text-[11px] tracking-[0.15em] text-[--text-tertiary]">
                    {(name || 'U')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-heading font-light text-[--text-primary]">
                    {user?.name ?? 'No name set'}
                  </p>
                  <p className="text-caption text-[--text-tertiary]">
                    {user?.email}
                  </p>
                  <p className="text-micro text-[--text-ghost] mt-[var(--space-1)]">
                    MEMBER SINCE{' '}
                    {user?.createdAt
                      ? format(new Date(user.createdAt), 'MMM yyyy').toUpperCase()
                      : '\u2014'}
                  </p>
                </div>
              </div>

              <div className="grid gap-[var(--space-4)] sm:grid-cols-2 mb-[var(--space-4)]">
                <div>
                  <p className="text-label text-[--text-label] mb-[var(--space-2)]">NAME</p>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <p className="text-label text-[--text-label] mb-[var(--space-2)]">AVATAR URL</p>
                  <Input
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-[var(--space-3)]">
                <Button
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>

            {/* Favorites */}
            <div className="animate-reveal" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between mb-[var(--space-4)]">
                <p className="text-label text-[--text-ghost]">
                  MY FAVORITES ({favorites?.length ?? 0})
                </p>
                <Link
                  href="/favorites"
                  className="flex items-center gap-1 text-micro text-[--text-ghost] hover:text-[--text-secondary] transition-colors"
                >
                  VIEW ALL
                  <ArrowRightIcon className="h-3 w-3" />
                </Link>
              </div>

              {!favorites || favorites.length === 0 ? (
                <p className="text-body text-[--text-tertiary]">
                  No favorites yet.{' '}
                  <Link href="/neighborhoods" className="text-[--text-secondary] hover:text-[--text-primary] transition-colors">
                    Browse neighborhoods
                  </Link>
                </p>
              ) : (
                <div>
                  {favorites.slice(0, 5).map((fav) => (
                    <Link
                      key={fav.id}
                      href={`/neighborhoods/${fav.neighborhood.id}`}
                      className="flex items-center justify-between py-[10px] border-t border-[rgba(38,38,38,0.08)] transition-colors hover:bg-[--bg-root]"
                    >
                      <div className="flex items-center gap-[var(--space-3)]">
                        <MapPinIcon className="h-3.5 w-3.5 text-[--text-ghost]" />
                        <div>
                          <p className="text-body text-[--text-primary] font-medium">
                            {fav.neighborhood.name}
                          </p>
                          <p className="text-micro text-[--text-ghost]">
                            {fav.neighborhood.city}, {fav.neighborhood.state}
                          </p>
                        </div>
                      </div>
                      <HeartIcon className="h-3.5 w-3.5 fill-[--accent-rose] text-[--accent-rose]" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
