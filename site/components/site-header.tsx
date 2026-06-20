import Link from 'next/link';

const navItems = [
  { href: '/docs', label: 'Docs' },
  { href: '/docs/tutorial/getting-started', label: 'Tutorial' },
  { href: '/docs/how-to/configuration', label: 'How-to' },
  { href: '/docs/reference/api', label: 'API' },
  { href: '/docs/explanation/overview', label: 'Explanation' },
] as const;

export function SiteHeader() {
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="form-mailer home">
        <span className="brand-mark" aria-hidden="true">
          <img src="/fm-mark.svg" alt="" width={60} height={60} />
        </span>
        <span className="brand-copy">
          <span className="brand-name">form-mailer</span>
          <span className="brand-tag">Lightweight form delivery</span>
        </span>
      </Link>

      <nav className="topnav" aria-label="Primary">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
