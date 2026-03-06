import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center gap-6">
      <h1 className="text-hero">404</h1>
      <p className="text-body text-[--text-secondary]">Page not found.</p>
      <Link href="/" className="btn-pill">
        Go Home
      </Link>
    </div>
  );
}
