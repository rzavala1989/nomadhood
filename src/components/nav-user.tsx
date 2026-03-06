import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { LogOutIcon, MoreVerticalIcon, UserCircleIcon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-[--bg-secondary]"
            >
              <Avatar className="h-7 w-7 rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-full bg-[--bg-secondary] text-[8px] tracking-[0.15em] text-[--text-tertiary]">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-[10px] tracking-[0.05em] text-[--text-secondary]">
                  {user.name}
                </span>
                <span className="truncate text-[8px] tracking-[0.05em] text-[--text-ghost]">
                  {user.email}
                </span>
              </div>
              <MoreVerticalIcon className="ml-auto size-3 text-[--text-ghost]" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 bg-[--bg-root] [box-shadow:inset_0_0_0_1px_var(--border-default)]"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2 text-left">
                <Avatar className="h-7 w-7 rounded-full">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-full bg-[--bg-secondary] text-[8px] tracking-[0.15em] text-[--text-tertiary]">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-[10px] tracking-[0.05em] text-[--text-secondary]">
                    {user.name}
                  </span>
                  <span className="truncate text-[8px] tracking-[0.05em] text-[--text-ghost]">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[rgba(38,38,38,0.08)]" />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="text-[10px] uppercase tracking-[0.15em] text-[--text-tertiary] hover:text-[--text-secondary]">
                <Link href="/profile">
                  <UserCircleIcon className="h-3.5 w-3.5" />
                  Account
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-[rgba(38,38,38,0.08)]" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-[10px] uppercase tracking-[0.15em] text-[--text-tertiary] hover:text-[--text-secondary]"
            >
              <LogOutIcon className="h-3.5 w-3.5" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
