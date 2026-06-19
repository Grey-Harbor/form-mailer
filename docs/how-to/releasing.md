# How-To: Releasing

This guide captures the release flow for the package while it is still evolving.

## Before release

- run `npm test`
- run `npm run pack:check`
- confirm `README.md` still reads like a landing page
- confirm the root export surface is still intentional

## Version bump

Use Conventional Commits to decide the next semver bump:

- `patch` for fixes and docs-only refinements
- `minor` for new public API or docs additions
- `major` for breaking changes

## Publish flow

1. Update the version.
2. Regenerate the lockfile only if dependencies changed.
3. Tag the release in git.
4. Push the branch and the tag.
5. Publish the package to npm.

## Post-release

- confirm the published tarball is still limited to runtime output plus the README
- capture any follow-up work in `PLAN.md` until the architecture handoff happens

