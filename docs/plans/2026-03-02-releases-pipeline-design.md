# Design: GitHub Releases, CI Fix, and Push Pipeline

Date: 2026-03-02

## Problem

- The CI workflow (`.github/workflows/main.yml`) is broken: uses `pnpm` but the project uses `bun`, references a non-existent `prebuild` script, uses `NEXTAUTH_SECRET` instead of `AUTH_SECRET`, and has stale action versions.
- No GitHub releases or versioning automation exists.
- No documented workflow for shipping changes.

## Solution

Option A: Claude-driven local pipeline with fixed CI for testing.

---

## Section 1: CI Workflow Fix

Replace `.github/workflows/main.yml` entirely.

Triggers: push to `main`, pull requests.

Two jobs:

**typecheck**: fast, no Postgres needed. Runs `bun run type-check` and `bun run lint`.

**e2e**: spins up Postgres, runs `bun run build` then `bun run test-e2e` with Playwright (Chromium only). Uploads test results as artifact.

Env changes:
- `AUTH_SECRET` (from secrets)
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` (from secrets)
- `DATABASE_URL` pointing to the Postgres service
- Remove `NEXTAUTH_SECRET` reference

Tooling changes:
- Replace `pnpm/action-setup` with bun install via `oven-sh/setup-bun`
- Cache `~/.bun` and `.next/cache`
- Update to `actions/checkout@v4`, `actions/upload-artifact@v4`
- Remove `pnpm prebuild` — use `bun run generate` (Prisma client gen)

---

## Section 2: Push Pipeline

Claude executes this when the user says "run the push pipeline" + a commit message.

Steps:

1. Read current `version` from `package.json`
2. Parse commit message for conventional commit type:
   - `fix:`, `chore:`, `docs:`, `refactor:`, `style:`, `test:`, `perf:` → patch
   - `feat:` → minor
   - `BREAKING CHANGE` anywhere → major
3. Bump version in `package.json`
4. Prepend entry to `CHANGELOG.md` (create if absent): version, date, commit message
5. Commit `package.json` and `CHANGELOG.md` with the provided message
6. Create git tag `v{new-version}`
7. Push commit and tag to origin
8. Create GitHub release: `gh release create v{new-version}` with CHANGELOG entry as body

Requirements: `gh` CLI authenticated (`gh auth status`).

---

## Section 3: CLAUDE.md Documentation

Add a `## Push Pipeline` section to the project `CLAUDE.md` documenting:
- Trigger phrase and format
- Conventional commit to bump type mapping
- The pipeline steps
- `gh` CLI authentication requirement
