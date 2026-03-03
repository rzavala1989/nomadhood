import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-[--bg-surface-2] animate-skeleton', className)}
      {...props}
    />
  );
}

export { Skeleton };
