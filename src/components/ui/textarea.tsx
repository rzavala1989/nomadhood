import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full bg-[--bg-surface-2] px-3 py-2 text-[11px] tracking-[0.01em] text-[--text-secondary] [box-shadow:inset_0_0_0_1px_var(--border-default)] transition-all placeholder:text-[--text-ghost] focus-visible:outline-none focus-visible:[box-shadow:inset_0_0_0_1px_var(--border-focus)] focus-visible:text-[--text-primary] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
