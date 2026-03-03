import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full bg-[--bg-surface-2] px-3 py-1 text-[11px] tracking-[0.01em] text-[--text-secondary] [box-shadow:inset_0_0_0_1px_var(--border-default)] transition-all file:border-0 file:bg-transparent file:text-[10px] file:font-medium file:text-[--text-secondary] placeholder:text-[--text-ghost] focus-visible:outline-none focus-visible:[box-shadow:inset_0_0_0_1px_var(--border-focus)] focus-visible:text-[--text-primary] disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
