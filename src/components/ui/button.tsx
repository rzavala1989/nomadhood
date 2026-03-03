import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-[10px] uppercase tracking-[0.18em] font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[--border-focus] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[--bg-inverse] text-[--text-inverse] hover:bg-[#1A1A18]/90 active:translate-y-0',
        destructive:
          'bg-black/10 text-[--text-primary] hover:bg-black/20',
        outline:
          'bg-transparent text-[--text-secondary] [box-shadow:inset_0_0_0_1px_var(--border-default)] hover:[box-shadow:inset_0_0_0_1px_var(--border-hover)] hover:text-[--text-primary]',
        secondary:
          'bg-[--bg-surface-2] text-[--text-secondary] [box-shadow:inset_0_0_0_1px_var(--border-default)] hover:bg-[--bg-surface-3] hover:text-[--text-primary]',
        ghost: 'text-[--text-tertiary] hover:bg-[--bg-surface-2] hover:text-[--text-secondary]',
        link: 'text-[--text-secondary] underline-offset-4 hover:underline hover:text-[--text-primary]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-[9px]',
        lg: 'h-10 px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
