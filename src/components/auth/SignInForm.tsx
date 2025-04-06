'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from 'next-auth/react';

export function SignInForm() {
  const [email, setEmail] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        signIn('email', {
          email,
          callbackUrl: '/dashboard',
          redirect: false,
        }).then((res) => {
          if (res?.ok) {
            alert('Check your inbox. Link is flying through the matrix');
          } else {
            alert('Email login failed. Double check your address.');
          }
        });
      }}

      className="space-y-6 w-full max-w-md bg-surface p-6 rounded-xl shadow-md"
    >
      <div className="space-y-2">
        <Label htmlFor="email" className="text-muted-foreground">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          placeholder="you@example.com"
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-input text-foreground placeholder-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <Button type="submit" className="w-full">
        Sign In
      </Button>
    </form>
  );
}
