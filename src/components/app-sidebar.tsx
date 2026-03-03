import * as React from 'react';
import {
  HeartIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  MapIcon,
  UserIcon,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const navItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboardIcon,
  },
  {
    title: 'Neighborhoods',
    url: '/neighborhoods',
    icon: MapIcon,
  },
  {
    title: 'Favorites',
    url: '/favorites',
    icon: HeartIcon,
  },
  {
    title: 'Profile',
    url: '/profile',
    icon: UserIcon,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();

  const user = {
    name: session?.user?.name ?? 'User',
    email: session?.user?.email ?? '',
    avatar: session?.user?.image ?? '',
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard" className="flex items-center gap-[var(--space-2)]">
                <MapPinIcon className="h-4 w-4 text-[--text-secondary]" />
                <span className="text-[10px] uppercase tracking-[0.18em] font-medium text-[--text-primary]">
                  Nomadhood
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
