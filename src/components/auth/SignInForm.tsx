'use client';

import { GithubIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';

export function SignInForm() {
  return (
    <div className="w-full max-w-md">
      <Button
        className="w-full"
        onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
      >
        <GithubIcon className="mr-2 h-4 w-4" />
        Continue with GitHub
      </Button>
    </div>
  );
}
