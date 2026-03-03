import Link from 'next/link';
import { useRouter } from 'next/router';
import { type LucideIcon } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
}) {
  const router = useRouter();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              router.pathname === item.url ||
              (item.url !== '/dashboard' &&
                router.pathname.startsWith(item.url));

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <Link
                    href={item.url}
                    className={
                      isActive
                        ? 'bg-[--bg-inverse] text-[--text-inverse] !text-[--text-inverse]'
                        : 'text-[--text-tertiary] hover:text-[--text-secondary] hover:bg-[--bg-surface-2]'
                    }
                  >
                    {item.icon && <item.icon className="h-3.5 w-3.5" />}
                    <span className="text-[10px] uppercase tracking-[0.18em]">
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
