import { BuildingIcon, HeartIcon, StarIcon, UsersIcon } from 'lucide-react';

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { trpc } from '@/utils/trpc';

export function SectionCards() {
  const { data: stats } = trpc.getDashboardStats.useQuery();

  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Neighborhoods</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats?.neighborhoodCount ?? '—'}
          </CardTitle>
          <div className="absolute right-4 top-4 text-muted-foreground">
            <BuildingIcon className="size-5" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Total neighborhoods listed</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Users</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats?.userCount ?? '—'}
          </CardTitle>
          <div className="absolute right-4 top-4 text-muted-foreground">
            <UsersIcon className="size-5" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Registered accounts</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Reviews</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats?.reviewCount ?? '—'}
          </CardTitle>
          <div className="absolute right-4 top-4 text-muted-foreground">
            <StarIcon className="size-5" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Neighborhood reviews submitted</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Favorites</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats?.favoriteCount ?? '—'}
          </CardTitle>
          <div className="absolute right-4 top-4 text-muted-foreground">
            <HeartIcon className="size-5" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Neighborhoods saved by users</div>
        </CardFooter>
      </Card>
    </div>
  );
}
