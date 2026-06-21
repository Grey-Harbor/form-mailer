# AGENTS.md

## Working Rules

- Use Conventional Commits for every commit.
- Keep each commit focused on one logical change.
- Prefer small, reviewable edits over broad rewrites.
- Do all work on feature or fix branches; do not work directly on `main`.
- Treat `main` as protected and never force-push to it.
- Do not use destructive git commands unless explicitly requested.
- Preserve user-authored changes when working in a dirty tree.
- Treat `PLAN.md` as a living document while the project is still being defined.
- Once the initial implementation is stable, replace `PLAN.md` with a committed `ARCHITECTURE.md`.
- Keep `ARCHITECTURE.md` aligned with the implementation once it becomes the committed design reference.

## Commit Messages

- Format: `<type>(<scope>): <description>`
- Use imperative mood.
- Keep the first line under 72 characters.
- Preferred types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `build`, `perf`

## Project Notes

- `form-mailer` is a lightweight Node.js package for form-to-email delivery.
- The package should stay framework-agnostic and TypeScript-first.
- Security-conscious defaults matter more than feature breadth.
- Keep the public API small, predictable, and easy to explain in examples.
- Default config loading should read process env directly and optionally layer a dotenv file from `FORM_MAILER_ENV_PATH`, with process env taking precedence.
- Keep `README.md`, `PLAN.md`, and `ARCHITECTURE.md` aligned with implementation changes that affect behavior or defaults.
- Keep end-user documentation in `./docs` and organize it with Diátaxis: tutorial, how-to, reference, explanation.
- Keep the root `README.md` as a landing page, not a long-form guide.
- When writing PR bodies, release notes, or other Markdown handoff files, always use real line breaks instead of literal `\n` escape sequences.
- After editing a Markdown handoff file, re-open it and verify the formatting before sharing or publishing it.

## Implementation Expectations

- Favor Node.js compatibility first.
- Keep dependencies minimal.
- Validate and sanitize input before transport work begins.
- Avoid overengineering transport abstractions before the first release shape is stable.
