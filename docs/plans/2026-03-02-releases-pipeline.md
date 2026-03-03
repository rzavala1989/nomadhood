# Releases, CI Fix, and Push Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the broken CI workflow, create a CHANGELOG, and document a Claude-driven push pipeline in CLAUDE.md so the user can say "run the push pipeline" + a commit message and Claude handles versioning, tagging, and GitHub release creation.

**Architecture:** Three independent file changes — rewrite the CI workflow (pnpm → bun, correct env vars, correct scripts, updated action versions), seed CHANGELOG.md at current version, and add a `## Push Pipeline` section to CLAUDE.md with exact step-by-step instructions Claude must follow.

**Tech Stack:** GitHub Actions, Bun, Prisma, Playwright, `gh` CLI, semver, conventional commits.

---

### Task 1: Fix CI Workflow

**Files:**
- Modify: `.github/workflows/main.yml`

**Step 1: Replace the workflow file entirely**

The current file uses `pnpm`, a non-existent `prebuild` script, `NEXTAUTH_SECRET`, and stale action versions. Replace with:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  typecheck:
    name: Type Check and Lint
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: postgresql://postgres@localhost:5432/nomadhood
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Cache bun store
        uses: actions/cache@v4
        with:
          path: ~/.bun
          key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lock') }}
          restore-keys: ${{ runner.os }}-bun-

      - name: Install deps
        run: bun install

      - name: Generate Prisma client
        run: bun run generate

      - name: Type check
        run: bun run type-check

      - name: Lint
        run: bun run lint

  e2e:
    name: Build and E2E Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: nomadhood
          POSTGRES_USER: postgres
          POSTGRES_HOST_AUTH_METHOD: trust
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://postgres@localhost:5432/nomadhood
      AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
      GITHUB_CLIENT_ID: ${{ secrets.GITHUB_CLIENT_ID }}
      GITHUB_CLIENT_SECRET: ${{ secrets.GITHUB_CLIENT_SECRET }}
      NODE_ENV: test
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Cache bun store
        uses: actions/cache@v4
        with:
          path: ~/.bun
          key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lock') }}
          restore-keys: ${{ runner.os }}-bun-

      - name: Cache Next.js build
        uses: actions/cache@v4
        with:
          path: .next/cache
          key: ${{ runner.os }}-${{ hashFiles('**/bun.lock') }}-nextjs

      - name: Install deps
        run: bun install

      - name: Install Playwright browsers
        run: bunx playwright install chromium

      - name: Generate Prisma client
        run: bun run generate

      - name: Run DB migrations
        run: bun run migrate

      - name: Build
        run: bun run build

      - name: Run E2E tests
        run: bun run test-e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results
          path: playwright/test-results
```

**Step 2: Verify the file is valid YAML**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/main.yml'))" && echo OK
```

Expected: `OK`

**Step 3: Commit**

```bash
git add .github/workflows/main.yml
git commit -m "fix: rewrite CI workflow for bun, correct env vars and action versions"
```

---

### Task 2: Create CHANGELOG.md

**Files:**
- Create: `CHANGELOG.md`

**Step 1: Write the initial CHANGELOG**

```markdown
# Changelog

## v0.1.0 — 2026-03-02

Initial release. Neighborhood discovery and review platform for digital nomads.
```

**Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: add CHANGELOG seeded at v0.1.0"
```

---

### Task 3: Add Push Pipeline to CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (project-level, at `/Users/ricardozavala/WebstormProjects/nomadhood/CLAUDE.md`)

**Step 1: Append the Push Pipeline section**

Add this section at the end of the file:

```markdown
---

## Push Pipeline

**Trigger:** User says "run the push pipeline" + a commit message.

**Requirements:** `gh` CLI must be authenticated. Verify with `gh auth status` before starting. Stop and tell the user if it is not.

### Bump Type from Commit Message

| Prefix | Bump |
|--------|------|
| `fix:`, `chore:`, `docs:`, `refactor:`, `style:`, `test:`, `perf:` | patch |
| `feat:` | minor |
| `BREAKING CHANGE` anywhere in message | major |

If the commit message has no recognized prefix, default to patch and note it.

### Steps (execute in order, stop on any error)

1. Run `gh auth status` — stop if not authenticated
2. Read `version` from `package.json`
3. Determine bump type from the commit message using the table above
4. Compute new semver version
5. Update `version` in `package.json`
6. Prepend this block to `CHANGELOG.md` (create the file if it does not exist):
   ```
   ## v{new-version} — {YYYY-MM-DD}

   {commit message}

   ```
7. Stage only `package.json` and `CHANGELOG.md`
8. Commit with the exact message the user provided (no Co-Authored-By, no AI attribution)
9. Create tag: `git tag v{new-version}`
10. Push commit and tag: `git push && git push --tags`
11. Create GitHub release:
    ```bash
    gh release create v{new-version} \
      --title "v{new-version}" \
      --notes "{the changelog entry body — just the commit message line}"
    ```
12. Report the release URL to the user
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add push pipeline instructions to CLAUDE.md"
```
