import * as React from 'react';
import {
  HeartIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  MapIcon,
  UserIcon,
  ShieldIcon,
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
import { trpc } from '@/utils/trpc';

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

const adminItem = {
  title: 'Admin',
  url: '/admin/users',
  icon: ShieldIcon,
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const { data: adminCheck } = trpc.user.isAdmin.useQuery(undefined, {
    enabled: !!session,
  });

  const user = {
    name: session?.user?.name ?? 'User',
    email: session?.user?.email ?? '',
    avatar: session?.user?.image ?? '',
  };

  const items = adminCheck?.isAdmin
    ? [...navItems, adminItem]
    : navItems;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard" className="flex items-center gap-[var(--space-2)]">
                <MapPinIcon className="h-4 w-4 text-[--text-tertiary]" />
                <span className="font-brand text-sm normal-case tracking-normal text-[--text-primary]">
                  Nomadhood
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
