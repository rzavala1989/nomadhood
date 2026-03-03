'use client';

import { useState } from 'react';
import { GithubIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signIn } from 'next-auth/react';

export function SignInForm() {
  const [email, setEmail] = useState('');

  return (
    <div className="w-full max-w-md space-y-[var(--space-6)]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          signIn('resend', {
            email,
            callbackUrl: '/dashboard',
            redirect: false,
          }).then((res) => {
            if (res?.ok) {
              toast.success('Check your inbox for the sign-in link');
            } else {
              toast.error('Sign-in failed. Check your email address.');
            }
          });
        }}
        className="space-y-[var(--space-4)]"
      >
        <div>
          <p className="text-label text-[--text-label] mb-[var(--space-2)]">EMAIL</p>
          <Input
            type="email"
            value={email}
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Sign In with Email
        </Button>
      </form>

      <div className="flex items-center gap-[var(--space-3)]">
        <div className="h-px flex-1 bg-black/[0.06]" />
        <span className="text-micro text-[--text-ghost]">OR</span>
        <div className="h-px flex-1 bg-black/[0.06]" />
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
      >
        <GithubIcon className="mr-2 h-4 w-4" />
        Continue with GitHub
      </Button>
    </div>
  );
}
