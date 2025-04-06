import { useState } from 'react';
import { SignUpForm } from '@/components/auth/SignUpForm.tsx';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    if (res.ok) {
      alert('Sign-up successful. Check your email to sign in!');
    } else {
      alert('Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-center text-3xl font-bold text-white">Sign Up</h1>
        <SignUpForm />
      </div>
    </div>
  );
}
