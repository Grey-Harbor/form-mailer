import type { Metadata } from 'next';
import Link from 'next/link';

import { buildPageMetadata, siteDescription, siteName, siteUrl, socialCard } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'TypeScript-first form-to-email delivery',
  description: siteDescription,
  canonicalPath: '/',
});

const packageBadgeHref = 'https://badge.fury.io/js/@greyharbor%2Fform-mailer';
const packageBadgeSrc = 'https://badge.fury.io/js/@greyharbor%2Fform-mailer.svg';

const cards = [
  {
    title: 'Validation first',
    description: 'Reject bad input before anything sends.',
  },
  {
    title: 'Transport stays small',
    description: 'Keep the send surface small and easy to swap.',
  },
  {
    title: 'Docs stay close',
    description: 'Stay focused on form delivery, not a full mail stack.',
  },
] as const;

const paths = [
  {
    title: 'Tutorial',
    description: 'Get to a first working setup.',
    href: '/docs/tutorial',
  },
  {
    title: 'How-to',
    description: 'Apply it in a real app.',
    href: '/docs/how-to',
  },
  {
    title: 'Explanation',
    description: 'See the design choices behind it.',
    href: '/docs/explanation',
  },
  {
    title: 'Reference',
    description: 'Check the API, options, and adapters.',
    href: '/docs/reference',
  },
] as const;

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: siteName,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any',
  description: siteDescription,
  url: siteUrl,
  image: new URL(socialCard.url, siteUrl).toString(),
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="landing" id="main">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Form-to-email delivery</span>
            <h1>form-mailer</h1>
            <p className="lede">
              A compact, TypeScript-first package for turning form submissions into email.
            </p>

            <div className="actions">
              <Link className="button primary" href="/docs/tutorial">
                Read the tutorials
              </Link>
              <Link className="button secondary" href="/docs">
                Browse the docs
              </Link>
            </div>
          </div>

          <aside className="hero-panel" aria-label="What form-mailer gives you">
            <div className="hero-panel-card">
              <strong>Typed outcomes</strong>
              <p>Success and failure stay explicit.</p>
            </div>
            <div className="hero-panel-card">
              <strong>Security-conscious defaults</strong>
              <p>Validate, allowlist, and sanitize first.</p>
            </div>
            <div className="hero-panel-card">
              <strong>Deployment-friendly</strong>
              <p>Works well in Node, serverless, and examples.</p>
            </div>
          </aside>
        </section>

        <section className="section" aria-labelledby="why-heading">
          <div className="section-heading">
            <p className="eyebrow">Why it stays small</p>
            <h2 id="why-heading">One job, kept sharp</h2>
            <p>Form-mailer handles form email and stays out of the rest of your stack.</p>
          </div>

          <div className="card-grid">
            {cards.map((card) => (
              <article className="info-card" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="docs-heading">
          <div className="section-heading">
            <p className="eyebrow">Choose your path</p>
            <h2 id="docs-heading">Choose the path that fits</h2>
            <p>Use the Diátaxis path that matches what you need now.</p>
          </div>

          <div className="path-grid">
            {paths.map((path) => (
              <article className="path-card" key={path.title}>
                <h3>{path.title}</h3>
                <p>{path.description}</p>
                <Link href={path.href}>Open {path.title.toLowerCase()}</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="built-heading">
          <div className="section-heading">
            <p className="eyebrow">What it fits</p>
            <h2 id="built-heading">Simple, reliable form email</h2>
          </div>

          <div className="story-grid">
            <article className="story-card">
              <h3>Contact and support forms</h3>
              <p>Keep inbound handling easy to embed and easy to trust.</p>
            </article>
            <article className="story-card">
              <h3>Lead routing</h3>
              <p>Route submissions without turning the app into a mail system.</p>
            </article>
            <article className="story-card">
              <h3>Deployment demos</h3>
              <p>Show a simple email path in example projects.</p>
            </article>
          </div>
        </section>

        <footer className="site-footer">
          <a
            className="package-badge package-badge-footer"
            href={packageBadgeHref}
            target="_blank"
            rel="noreferrer"
            aria-label="npm package version"
          >
            <img src={packageBadgeSrc} alt="" />
          </a>
          <div className="footer-links" aria-label="Related links">
            <a href="https://github.com/Grey-Harbor/form-mailer" target="_blank" rel="noreferrer">
              GitHub repository
            </a>
            <a href="https://www.greyharborsoftware.com" target="_blank" rel="noreferrer">
              Grey Harbor Software
            </a>
          </div>
          <p>
            &copy; {new Date().getFullYear()} Grey Harbor Software. All rights reserved.
          </p>
        </footer>
      </main>
    </>
  );
}
