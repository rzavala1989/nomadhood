import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] font-normal transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-[--bg-surface-2] text-[--text-secondary] [box-shadow:inset_0_0_0_1px_var(--border-default)]',
        secondary:
          'bg-[--bg-surface-1] text-[--text-tertiary] [box-shadow:inset_0_0_0_1px_var(--border-subtle)]',
        destructive:
          'bg-[--accent-rose] text-[--accent-charcoal]',
        outline: 'text-[--text-tertiary] [box-shadow:inset_0_0_0_1px_var(--border-default)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
