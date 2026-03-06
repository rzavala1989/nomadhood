import Link from 'next/link';

const navLinks = [
  { label: 'Browse', href: '/neighborhoods' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Favorites', href: '/favorites' },
  { label: 'Compare', href: '/compare' },
];

const socialLinks = [
  { label: 'GitHub', href: 'https://github.com' },
];

export function Footer() {
  return (
    <footer className="bg-[--bg-secondary] pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-5">
            <p className="font-brand text-2xl text-[--text-primary] mb-4">Nomadhood</p>
            <p className="text-body text-[--text-secondary] max-w-sm leading-relaxed">
              Neighborhood intelligence for digital nomads. Reviews, data, and maps from people who actually live there.
            </p>
          </div>

          <div className="col-span-4 lg:col-span-2 lg:col-start-7">
            <p className="section-label-accent mb-4">Navigate</p>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body text-[--text-secondary] hover:text-[--text-primary] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-4 lg:col-span-2">
            <p className="section-label-accent mb-4">Social</p>
            <ul className="space-y-3">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body text-[--text-secondary] hover:text-[--text-primary] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-4 lg:col-span-2">
            <p className="section-label-accent mb-4">Info</p>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/auth/signin"
                  className="text-body text-[--text-secondary] hover:text-[--text-primary] transition-colors"
                >
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-[rgba(38,38,38,0.08)] flex items-center justify-between">
          <p className="text-[9px] text-[rgba(38,38,38,0.30)] tracking-widest">
            &copy; {new Date().getFullYear()} NOMADHOOD
          </p>
          <p className="text-[9px] text-[rgba(38,38,38,0.30)] tracking-widest">
            ALL RIGHTS RESERVED
          </p>
        </div>
      </div>
    </footer>
  );
}
