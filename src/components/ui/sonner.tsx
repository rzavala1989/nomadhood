import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-[--bg-root] group-[.toaster]:text-[--text-primary] group-[.toaster]:[box-shadow:inset_0_0_0_1px_var(--border-default)] group-[.toaster]:rounded-none group-[.toaster]:font-[--font-mono] group-[.toaster]:text-[11px] group-[.toaster]:tracking-[0.01em]',
          description: 'group-[.toast]:text-[--text-secondary]',
          actionButton:
            'group-[.toast]:bg-[--bg-inverse] group-[.toast]:text-[--text-inverse]',
          cancelButton:
            'group-[.toast]:bg-[--bg-surface-2] group-[.toast]:text-[--text-secondary]',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
