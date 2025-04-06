'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    alert('Check your email to complete sign up');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md bg-surface p-6 rounded-xl shadow-md">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-muted-foreground">
          Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="bg-input text-foreground placeholder-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-muted-foreground">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-input text-foreground placeholder-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <Button type="submit" className="w-full">
        Sign Up
      </Button>
    </form>
  );
}
