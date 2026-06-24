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
    title: 'Low footprint',
    description: 'Keep the integration small and easy to carry into existing apps.',
  },
  {
    title: 'Validation first',
    description: 'Reject bad input before anything sends.',
  },
  {
    title: 'Security-conscious',
    description: 'Validate, allowlist, and sanitize before send.',
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
              A compact, TypeScript-first package for low-footprint form-to-email delivery in
              Node.js apps and serverless handlers.
            </p>

            <div className="actions">
              <Link className="button primary" href="/docs/tutorial">
                Start with the tutorial
              </Link>
              <Link className="button secondary" href="/docs/reference/api">
                See the API
              </Link>
            </div>
          </div>

          <aside className="hero-panel" aria-label="What form-mailer gives you">
            <div className="hero-panel-card">
              <strong>Embedded, not hosted</strong>
              <p>Built to fit inside an existing app.</p>
            </div>
            <div className="hero-panel-card">
              <strong>Simple integration</strong>
              <p>Keep validation and sending simple.</p>
            </div>
            <div className="hero-panel-card">
              <strong>Typed outcomes</strong>
              <p>Success and failure stay explicit.</p>
            </div>
          </aside>
        </section>

        <section className="section" aria-labelledby="why-heading">
          <div className="section-heading">
            <p className="eyebrow">Focused by design</p>
            <h2 id="why-heading">One job, kept simple</h2>
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

        <section className="section" aria-labelledby="exist-heading">
          <div className="section-heading">
            <p className="eyebrow">Why it exists</p>
            <h2 id="exist-heading">A utility, not a mail platform</h2>
            <p>
              Most apps do not need a mail platform. They need a small delivery utility that
              lives inside the deployment, validates input first, and hands the message to
              a transport without adding platform overhead.
            </p>
          </div>
        </section>

        <section className="section" aria-labelledby="docs-heading">
          <div className="section-heading">
            <p className="eyebrow">Guides & References</p>
            <h2 id="docs-heading">Choose your path</h2>
            <p>Whether you’re integrating quickly or exploring, the documentation is structured to help.</p>
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
