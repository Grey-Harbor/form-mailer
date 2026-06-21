import fs from 'node:fs';
import path from 'node:path';

import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { toString } from 'mdast-util-to-string';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import Slugger from 'github-slugger';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import type { Root as HastRoot } from 'hast';
import type { Root as MdastRoot, Link, Heading } from 'mdast';
import { visit } from 'unist-util-visit';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import type { TOCItemType } from 'fumadocs-core/toc';

import { titleForDoc } from '@/lib/format';

const docsRoot = path.resolve(process.cwd(), '../docs');
const repoRoot = path.resolve(process.cwd(), '..');
const githubBase = 'https://github.com/Grey-Harbor/form-mailer/blob/main';

interface DocPage {
  slug: string[];
  filePath: string;
  title: string;
  description: string | undefined;
  toc: TOCItemType[];
  body: ReactNode;
}

const docEntries = new Map<string, DocPage>();

function collectMarkdownFiles(dir: string, nested = ''): string[] {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of items) {
    const relative = nested ? path.posix.join(nested, entry.name) : entry.name;

    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(path.join(dir, entry.name), relative));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(relative);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function slugFromFile(filePath: string): string[] {
  const normalized = filePath.replace(/\\/g, '/').replace(/\.md$/, '');
  if (normalized === 'README') {
    return [];
  }

  return normalized.split('/').map((segment) => (segment === 'README' ? '' : segment)).filter(Boolean);
}

function routeFromSlug(slug: string[]): string {
  return slug.length === 0 ? '/docs' : `/docs/${slug.join('/')}`;
}

function isExternalHref(href: string): boolean {
  return /^(?:[a-z]+:)?\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:');
}

function rewriteHref(filePath: string, href: string): string {
  const hashIndex = href.indexOf('#');
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
  const rawPath = hashIndex >= 0 ? href.slice(0, hashIndex) : href;

  if (!rawPath || rawPath.startsWith('#') || isExternalHref(rawPath) || rawPath.startsWith('/')) {
    return href;
  }

  const currentAbs = path.posix.join('/docs', filePath);
  const targetAbs = path.posix.normalize(
    path.posix.join(path.posix.dirname(currentAbs), rawPath),
  );

  if (targetAbs.startsWith('/docs/')) {
    const relative = targetAbs.slice('/docs/'.length);
    const withoutExt = relative.replace(/\.(md|mdx)$/i, '');
    const segments = withoutExt.split('/').filter(Boolean);
    const route =
      segments[segments.length - 1] === 'README'
        ? `/docs/${segments.slice(0, -1).join('/')}`
        : `/docs/${withoutExt}`;

    return `${route.replace(/\/$/, '')}${hash}`;
  }

  const repoPath = path.posix.relative('/docs', targetAbs).replace(/^\.\.\//, '');
  return `${githubBase}/${repoPath}${hash}`;
}

function createBody(markdown: string, filePath: string): DocPage {
  const processor = unified().use(remarkParse).use(remarkGfm);
  const tree = processor.parse(markdown) as MdastRoot;
  const slugger = new Slugger();
  const toc: TOCItemType[] = [];

  let title = '';
  let description = '';
  let strippedTitle = false;

  visit(tree, 'link', (node: Link) => {
    node.url = rewriteHref(filePath, node.url);
  });

  visit(tree, 'heading', (node: Heading) => {
    const text = toString(node).trim();
    if (!text) {
      return;
    }

    if (node.depth === 1 && !title) {
      title = text;
      return;
    }

    if (node.depth >= 2) {
      const id = slugger.slug(text);
      node.data ??= {};
      node.data.hProperties = {
        ...(node.data.hProperties as Record<string, unknown> | undefined),
        id,
      };
      toc.push({
        depth: node.depth,
        title: text,
        url: `#${id}`,
      });
    }
  });

  const filteredChildren = tree.children.filter((node, index) => {
    if (!strippedTitle && index === 0 && node.type === 'heading' && node.depth === 1) {
      strippedTitle = true;
      return false;
    }

    if (!title && node.type === 'heading' && node.depth === 1) {
      title = toString(node).trim();
      return false;
    }

    if (!description && title && node.type === 'paragraph') {
      description = toString(node).trim();
      return false;
    }

    return true;
  });

  tree.children = filteredChildren;

  const hast = unified().use(remarkRehype, { clobberPrefix: '' }).runSync(tree) as HastRoot;

  return {
    slug: slugFromFile(filePath),
    filePath,
    title: title || titleForDoc(path.basename(filePath, '.md')),
    description: description || undefined,
    toc,
    body: toJsxRuntime(hast, {
      Fragment,
      jsx,
      jsxs,
      components: {
        a(props) {
          const { href, children, ...rest } = props as AnchorHTMLAttributes<HTMLAnchorElement>;
          return jsx('a', {
            href,
            ...rest,
            children,
          });
        },
      },
    }),
  };
}

function buildDocIndex(): void {
  if (docEntries.size > 0) {
    return;
  }

  for (const relative of collectMarkdownFiles(docsRoot)) {
    const absolute = path.join(docsRoot, relative);
    const markdown = fs.readFileSync(absolute, 'utf8');
    const entry = createBody(markdown, relative.replace(/\\/g, '/'));
    docEntries.set(entry.slug.join('/'), entry);
  }
}

export function getDocPage(slug: string[] | undefined): DocPage | undefined {
  buildDocIndex();
  return docEntries.get((slug ?? []).join('/'));
}

export function getDocParams(): { slug: string[] }[] {
  buildDocIndex();
  return [...docEntries.values()].map((entry) => ({ slug: entry.slug }));
}

export function getDocTitle(slug: string[] | undefined): string {
  const page = getDocPage(slug);
  return page?.title ?? 'form-mailer';
}

export function getDocDescription(slug: string[] | undefined): string | undefined {
  return getDocPage(slug)?.description;
}

export function getDocToc(slug: string[] | undefined): TOCItemType[] {
  return getDocPage(slug)?.toc ?? [];
}
