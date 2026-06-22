# Tutorial: Build from Source

This tutorial walks through a full local build of `form-mailer` from a fresh checkout.

Use it when you want to:

- build the package locally
- run the main checks before making changes
- preview the docs and brochure site the same way GitHub Pages will serve it

If you only want the package API, start with [Getting Started](./getting-started.md).
If you want the contributor workflow after the build is working, continue with [How-To: Contribute Changes](../how-to/contributing.md).

## Clone the repository

Start from a clean local checkout:

```bash
git clone git@github.com:Grey-Harbor/form-mailer.git
cd form-mailer
```

This tutorial assumes you are running commands from the repository root unless a step says otherwise.

## Install dependencies

The repository has two Node work areas:

- the package itself at the repo root
- the documentation and Pages site in `./site`

Install both:

```bash
npm install
npm --prefix site install
```

## Build the package

Build the published package output:

```bash
npm run build
```

This compiles the TypeScript package into `dist/`.

When the build succeeds, you should have the package artifacts that power local tests and eventual npm publishing.

## Run the core checks

Run the type check first:

```bash
npm run check
```

Then run the tests:

```bash
npm test
```

If you want the same combined check used in CI, you can also run:

```bash
npm run ci
```

That sequence checks the package build and test path without involving the Pages site.

## Build the site and docs

Build the site export from the repo root:

```bash
npm run site:build
```

This runs the site build in `./site` and produces a static export in `site/out`.

That export includes:

- the landing page
- the Fumadocs-rendered documentation
- the assets that GitHub Pages will publish

If you are already working inside `./site`, the equivalent build command is:

```bash
npm run build
```

## Preview the Pages output locally

Preview the built static site from the repository root:

```bash
npm run preview
```

From `./site`, the equivalent preview command is:

```bash
npm run preview
```

This preview serves the exported site from `site/out`, which makes it the right way to check Pages behavior locally.

Useful routes to verify:

- `/` for the landing page
- `/docs/` for the docs index
- `/docs/tutorial/` for tutorial routes
- `/brand/social-card.png` for the social card asset

## What a healthy build looks like

At the end of this tutorial, you should be able to:

- build the package without TypeScript errors
- run the package tests successfully
- export the site into `site/out`
- preview the landing page and docs locally

If the package build works but the site export fails, the package and the Pages site should be debugged separately.
The root scripts check package behavior first, while the `site` build checks the documentation and brochure experience.

## Where to go next

- For a first usage example, continue with [Getting Started](./getting-started.md).
- For configuration details after the build is working, use [How-To: Configuration](../how-to/configuration.md).
- For the branch, commit, and pull request workflow, use [How-To: Contribute Changes](../how-to/contributing.md).
