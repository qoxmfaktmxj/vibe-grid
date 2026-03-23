# VibeGrid Git + Vercel Deployment Guide

## Recommended target

- GitHub owner: `qoxmfaktmxj`
- Repository: `vibe-grid`
- Vercel app root: `apps/playground`
- Public domain: `grid.minseok91.cloud`

## Current local status

- Local git repo exists
- Git remote is configured as `origin`
- Current remote: `https://github.com/qoxmfaktmxj/vibe-grid.git`
- Vercel deployment is already connected
- Current public domain is `grid.minseok91.cloud`
- The deployable app is `apps/playground`

## Why deploy `apps/playground`

`apps/playground` is the best first deployment target because it already acts as the grid validation platform.

- `/labs/grid`: business grid behaviors
- `/labs/bench`: large-data rendering and sticky behavior
- `/labs/compatibility`: IBSheet replacement checks

This lets one Vercel project cover both stakeholder demos and technical regression checks.

## Step 1. Create or connect the GitHub repository

Authenticate once:

```bash
gh auth login
```

If you need to create the repository from the repo root:

```bash
gh repo create qoxmfaktmxj/vibe-grid --private --source=. --remote=origin
```

Then push:

```bash
git add .
git commit -m "chore: bootstrap vibe-grid workspace"
git push -u origin master
```

If you prefer a public repository, replace `--private` with `--public`.

## Step 2. Import the repo into Vercel

Recommended path: use the Vercel dashboard Git import flow.

1. Open Vercel and choose **Add New > Project**
2. Select the `qoxmfaktmxj/vibe-grid` repository
3. Set **Root Directory** to `apps/playground`
4. In the Root Directory settings, enable **Include source files outside of the Root Directory in the Build Step**
5. Keep the detected package manager from the monorepo root
6. Deploy

Important:

- This repo is a monorepo, so Vercel should be connected from the repo root while the project's **Root Directory** points at `apps/playground`
- `apps/playground` imports shared source code from `packages/*`, so the project must include source files outside the root directory during the build
- Keep the branch used for production aligned with your Git default branch. The current local branch is `master`, so either:
  - keep Vercel production branch as `master`, or
  - rename the branch to `main` before connecting the repo

## Step 3. Optional CLI linkage

If you want local CLI control after the dashboard import:

```bash
npm install -g vercel
vercel link --repo
```

Run the command from the monorepo root, not from `apps/playground`.

## Step 4. Add the custom domain

After the first successful deployment:

1. Open the Vercel project
2. Go to **Settings > Domains**
3. Add `grid.minseok91.cloud`
4. Copy the DNS value Vercel shows for that subdomain
5. Add the DNS record at your DNS provider

For a subdomain, Vercel expects a `CNAME` record. Use the exact value Vercel shows in the dashboard for the project.

## Step 5. Git-based operating model

Recommended flow:

- `master`: deploy target branch for shared preview or production
- `codex/*`: feature or experiment branches
- every push: GitHub Actions runs lint/build
- every push to the connected Vercel branch: Vercel creates a deployment

Recommended loop:

```bash
git checkout -b codex/<short-topic>
git add .
git commit -m "<type>: <summary>"
git push -u origin codex/<short-topic>
```

Then merge into `master` when the playground/bench checks are acceptable.

## Step 6. Minimum pre-deploy checklist

- `npm run lint`
- `npm run build`
- test `http://localhost:3203/labs/grid`
- test `http://localhost:3203/labs/bench`
- confirm `apps/playground` is still the deploy target
- confirm **Include source files outside of the Root Directory in the Build Step** is enabled
- confirm no secrets are committed

## Notes from official docs

- Vercel monorepos should be linked/imported from the repository root while each project selects its own **Root Directory**
- If a project imports source files from outside that root directory, Vercel provides an option to include those files in the build
- Vercel Git import supports selecting the project root directory during import
- Subdomains such as `grid.minseok91.cloud` are configured as `CNAME` records
- If the domain is already attached elsewhere, Vercel may require DNS verification before it can be assigned
