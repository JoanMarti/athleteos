# Vercel Deploy Fix — Apply These Files to Your Repo

## What was wrong

1. Vercel detected Turborepo and ran `turbo run build` on the whole monorepo
2. It tried to build `apps/api` (NestJS) which doesn't work on Vercel
3. It used `yarn` instead of `npm/pnpm` and had no lockfile
4. Next.js 14.2.0 has a known security vulnerability warning

## What these files fix

| File | What it does |
|---|---|
| `vercel.json` | Tells Vercel to only build `apps/web` with `next build` |
| `.npmrc` | Configures npm for monorepo hoisting |
| `pnpm-workspace.yaml` | Excludes `apps/api` from workspace |
| `apps/web/package.json` | Removes workspace deps, upgrades Next.js to 15.2.4 |
| `apps/web/tsconfig.json` | Points `@athleteos/types` and `@athleteos/utils` to local files |
| `apps/web/next.config.js` | Removes `transpilePackages` (no longer needed) |
| `apps/web/src/lib/athleteos/types.ts` | Local copy of shared types |
| `apps/web/src/lib/athleteos/utils.ts` | Local copy of shared utils |

## How to apply

Copy all these files into your GitHub repo maintaining the same folder structure,
then commit and push. Vercel will automatically re-deploy.

```bash
# From your repo root:
git add .
git commit -m "fix: vercel deployment configuration"
git push
```

## Vercel settings to verify

In your Vercel project → Settings → General:
- Framework Preset: Next.js (auto-detected)
- Root Directory: leave EMPTY (vercel.json handles it)
- Build Command: leave EMPTY (vercel.json handles it)
- Install Command: leave EMPTY (vercel.json handles it)

## Required environment variables in Vercel

Settings → Environment Variables — add these minimum values:

```
NEXT_PUBLIC_SUPABASE_URL       = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = your-anon-key
SUPABASE_SERVICE_ROLE_KEY      = your-service-role-key
ENCRYPTION_KEY                 = (64 char hex — generate below)
NEXT_PUBLIC_APP_URL            = https://your-project.vercel.app
STRAVA_CLIENT_ID               = (from developers.strava.com)
STRAVA_CLIENT_SECRET           = (from developers.strava.com)
```

Generate ENCRYPTION_KEY:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
