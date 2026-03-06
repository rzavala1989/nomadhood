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
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </DashboardLayout>
    );
  }

  if (!adminCheck?.isAdmin) {
    router.push('/dashboard');
    return null;
  }

  return (
    <DashboardLayout title={title}>
      <div className="flex gap-3 mb-8">
        {adminTabs.map((tab) => {
          const isActive = router.pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-label tracking-[0.2em] transition-all ${
                isActive
                  ? 'bg-[--accent-rose] text-[--accent-charcoal]'
                  : 'bg-[--bg-secondary] text-[--text-tertiary] hover:text-[--text-primary]'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </DashboardLayout>
  );
}
