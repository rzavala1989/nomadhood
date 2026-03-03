import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export function DashboardLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-[--bg-root]">
        <div className="h-8 w-32 bg-[--bg-surface-2] animate-skeleton" />
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title={title} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
