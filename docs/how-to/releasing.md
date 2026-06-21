# How-To: Releasing

This guide walks through the tag-driven release flow for the package.

## Before release

- run `npm test`
- run `npm run pack:check`
- confirm `README.md` still reads like a landing page
- confirm the root export surface is still intentional
- confirm the git tag will follow the `v*` semver pattern used by CI

## Version bump

Use Conventional Commits to decide the next semver bump:

- `patch` for fixes and docs-only refinements
- `minor` for new public API or docs additions
- `major` for breaking changes

## Publish flow

1. Update the version in `package.json`.
2. Regenerate the lockfile only if dependencies changed.
3. Commit the release version bump.
4. Create and push a semver tag like `v0.1.4`.
5. Let GitHub Actions run the existing checks and publish with `npm publish --provenance`.

The CI publish job should only run for tag pushes that match `v*`.

## GitHub Actions secret

The publish job expects an npm token stored as the `NPM_TOKEN` repository secret.

That token is injected into the publish step as `NODE_AUTH_TOKEN`, which is what `npm publish` uses for registry authentication in GitHub Actions.

## CI checks

For both branch and tag runs, CI should:

- install dependencies with `npm ci`
- run `npm run check`
- run `npm test`
- run `npm run pack:check`

On matching tags, the workflow should publish the package to npm after those checks succeed.

## Post-release

- confirm the published tarball is still limited to runtime output plus the README
- capture any follow-up work in `PLAN.md` until the architecture handoff happens
