import type { Metadata } from 'next';

export const siteName = 'form-mailer';
export const siteUrl = 'https://form-mailer.greyharborsoftware.com';
export const siteDescription =
  'TypeScript-first form-to-email delivery for embeddable apps and serverless handlers.';
export const siteKeywords = [
  'form-to-email',
  'TypeScript',
  'Node.js',
  'serverless',
  'embeddable apps',
  'secure defaults',
  'form submissions',
] as const;

export const socialCard = {
  url: '/brand/social-card.png',
  width: 1731,
  height: 909,
  alt: 'form-mailer social card',
} as const;

function withTrailingSlash(path: string): string {
  if (path === '/') {
    return path;
  }

  return path.endsWith('/') ? path : `${path}/`;
}

export function buildPageMetadata({
  title,
  description,
  canonicalPath,
}: {
  title: string;
  description: string | undefined;
  canonicalPath: string;
}): Metadata {
  const canonical = withTrailingSlash(canonicalPath);
  const resolvedDescription = description ?? siteDescription;

  return {
    title,
    description: resolvedDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description: resolvedDescription,
      url: canonical,
      siteName,
      type: 'website',
      images: [socialCard],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: resolvedDescription,
      images: [socialCard.url],
    },
  };
}
