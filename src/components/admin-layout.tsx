import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { UsersIcon, MapIcon, MessageSquareIcon, DatabaseIcon } from 'lucide-react';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';

const adminTabs = [
  { label: 'Users', href: '/admin/users', icon: UsersIcon },
  { label: 'Neighborhoods', href: '/admin/neighborhoods', icon: MapIcon },
  { label: 'Reviews', href: '/admin/reviews', icon: MessageSquareIcon },
  { label: 'Data', href: '/admin/data', icon: DatabaseIcon },
];

export function AdminLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { data: adminCheck, isLoading } = trpc.user.isAdmin.useQuery();

  if (isLoading) {
    return (
      <DashboardLayout title="Admin">
        <div className="p-[var(--space-6)]">
          <Skeleton className="h-[300px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!adminCheck?.isAdmin) {
    router.push('/dashboard');
    return null;
  }

  return (
    <DashboardLayout title={title}>
      <div className="flex flex-col">
        {/* Admin sub-nav */}
        <div className="flex gap-px px-[var(--space-6)] pt-[var(--space-4)]">
          {adminTabs.map((tab) => {
            const isActive = router.pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-2)] text-[9px] uppercase tracking-[0.18em] transition-colors ${
                  isActive
                    ? 'bg-[--bg-inverse] text-[--text-inverse]'
                    : 'surface-1 text-[--text-tertiary] hover:text-[--text-secondary]'
                }`}
              >
                <tab.icon className="h-3 w-3" />
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="p-[var(--space-6)]">{children}</div>
      </div>
    </DashboardLayout>
  );
}
