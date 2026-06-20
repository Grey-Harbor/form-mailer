import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { RootProvider } from 'fumadocs-ui/provider';

import { SiteHeader } from '@/components/site-header';
import './global.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://form-mailer.greyharborsoftware.com'),
  title: {
    default: 'form-mailer',
    template: '%s | form-mailer',
  },
  description:
    'Lightweight form-to-email delivery for embeddable apps and serverless handlers.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootProvider search={{ enabled: false }} theme={{ enabled: false }}>
          <div className="page-shell" id="top">
            <a className="skip-link" href="#main">
              Skip to content
            </a>
            <SiteHeader />
            {children}
          </div>
        </RootProvider>
      </body>
    </html>
  );
}
