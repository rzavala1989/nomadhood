import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

import { AppSidebar } from '@/components/app-sidebar.tsx';
import { ChartAreaInteractive } from '@/components/chart-area-interactive.tsx';
import { DataTable } from '@/components/data-table.tsx';
import { SectionCards } from '@/components/section-cards.tsx';
import { SiteHeader } from '@/components/site-header.tsx';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar.tsx';

import data from '@/app/dashboard/data.json';

export default function Dashboard() {

  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <p className="text-white text-center mt-10">Loading...</p>;
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
