# How-To: Contribute Changes

This guide covers the normal contributor workflow for `form-mailer`.

Use it when you want to make a code or docs change and move it through a branch and pull request cleanly.

For the project-wide rules behind this workflow, see [AGENTS.md](../../AGENTS.md).

## Clone the repository

Start by cloning the project and moving into the repository root:

```bash
git clone git@github.com:Grey-Harbor/form-mailer.git
cd form-mailer
```

Install dependencies before making changes:

```bash
npm install
npm --prefix site install
```

## Start on a branch

Do not work directly on `main`.

Create a focused branch for the change:

```bash
git switch -c docs/my-change
```

Pick a branch name that describes the work itself.
Do not use agent names or unrelated internal references in branch names.

## Make and verify the change

Keep the change small enough to review as one logical unit.

Common local checks:

```bash
npm run check
npm test
```

If you change the site or docs, also preview the Pages output locally:

```bash
npm run site:build
npm run preview
```

From `./site`, the equivalent commands are:

```bash
npm run build
npm run preview
```

That preview serves the exported site, so it is the right way to check Pages behavior before opening a PR.

## Commit the work

Stage only the files that belong to the change:

```bash
git add -A
```

Commit messages must follow Conventional Commits:

```bash
git commit -m "docs(scope): describe the change"
```

Commit expectations:

- use the format `<type>(<scope>): <description>`
- use imperative mood
- keep the first line under 72 characters
- keep each commit to one logical change
- avoid vague messages like `update stuff`
- do not include agent names in commit messages

Common types for this project:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`
- `ci`
- `build`
- `perf`

## Push the branch

Push the branch and set the upstream:

```bash
git push -u origin docs/my-change
```

## Open the pull request

Create the PR from your branch into `main`:

```bash
gh pr create --base main --head docs/my-change
```

PR expectations:

- keep the PR focused on one reviewable change
- use real Markdown line breaks in the PR body
- summarize what changed in plain language
- note the checks you ran
- include any important assumptions or follow-up work

## Documentation-specific expectations

If the change affects behavior, defaults, or public usage, keep the project docs aligned:

- update `README.md` when the landing-page view of the project changes
- update `ARCHITECTURE.md` when committed design guidance changes
- update the relevant page in `./docs` when user-facing guidance changes

When writing docs:

- keep the tone concise and detailed without sounding robotic
- use contextual links when another topic already has a home
- avoid vague link text such as "see here"
- keep the root `README.md` as a landing page, not a long-form guide

## Things to avoid

- do not work directly on `main`
- do not force-push `main`
- do not use destructive git commands unless explicitly requested
- do not leave related docs stale after changing behavior
