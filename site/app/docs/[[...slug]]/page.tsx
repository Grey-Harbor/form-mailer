import type { Metadata } from 'next';

import { notFound } from 'next/navigation';
import { PageArticle, PageRoot } from 'fumadocs-ui/layouts/docs/page';
import { DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page';

import { getDocDescription, getDocPage, getDocParams, routeFromSlug } from '@/lib/docs';
import { titleForDoc } from '@/lib/format';
import { buildPageMetadata } from '@/lib/seo';

interface DocsPageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

const docsIndexDescription =
  'Browse form-mailer tutorials, how-to guides, API reference, and explanation to get from first setup to exact integration details.';

const docsIndexKeywords = [
  'form-mailer documentation',
  'form-mailer tutorial',
  'form-mailer API reference',
  'form-mailer guides',
  'Node.js form-to-email docs',
  'TypeScript form-to-email docs',
] as const;

export function generateStaticParams() {
  return getDocParams();
}

export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getDocPage(slug);

  if (!page) {
    return {};
  }

  const title = page.title ?? titleForDoc(page.filePath.replace(/\.md$/, ''), 'Documentation');
  const isDocsIndex = (slug ?? []).length === 0;
  const description = isDocsIndex ? docsIndexDescription : page.description;

  const metadata = buildPageMetadata({
    title,
    description,
    canonicalPath: routeFromSlug(slug ?? []),
  });

  if (isDocsIndex) {
    metadata.keywords = [...docsIndexKeywords];
  }

  return metadata;
}

export default async function DocsPageRoute({ params }: DocsPageProps) {
  const { slug } = await params;
  const page = getDocPage(slug);

  if (!page) {
    notFound();
  }

  const title = page.title ?? titleForDoc(page.filePath.replace(/\.md$/, ''), 'Documentation');
  const description = getDocDescription(slug);

  return (
    <main className="docs-shell" id="main">
      <div className="docs-frame">
        <PageRoot toc={page.toc.length > 0 ? { toc: page.toc } : false} className="docs-root">
          <PageArticle className="docs-article">
            <DocsTitle>{title}</DocsTitle>
            {description ? <DocsDescription>{description}</DocsDescription> : null}
            <DocsBody>{page.body}</DocsBody>
          </PageArticle>
        </PageRoot>
      </div>
    </main>
  );
}
