import { SignUpForm } from '@/components/auth/SignUpForm.tsx';

export default function SignUp() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-center text-3xl font-bold text-white">Sign Up</h1>
        <SignUpForm />
      </div>
    </div>
  );
}
