# AthleteOS

**Fitness intelligence platform** for endurance athletes — unifies Strava + WHOOP data into actionable daily training recommendations.

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloudflare CDN                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┼──────────────┐
            │               │              │
      ┌─────▼────┐   ┌──────▼─────┐  ┌────▼──────┐
      │ Next.js  │   │  NestJS    │  │  Expo RN  │
      │  :3001   │   │   :3000    │  │  (mobile) │
      └──────────┘   └──────┬─────┘  └───────────┘
                            │
            ┌───────────────┼──────────────┐
            │               │              │
      ┌─────▼────┐   ┌──────▼─────┐  ┌────▼──────┐
      │PostgreSQL│   │   Redis    │  │  S3/R2    │
      │+Timescale│   │  (BullMQ)  │  │ (exports) │
      └──────────┘   └────────────┘  └───────────┘
```

## Stack

| Layer         | Technology                          | Why                                   |
|---------------|-------------------------------------|---------------------------------------|
| Frontend web  | Next.js 14 (App Router) + TypeScript | SSR, Vercel deploy, React ecosystem   |
| Mobile        | Expo + React Native                  | Shared types with web, cross-platform |
| Backend       | NestJS + TypeScript                  | Opinionated DI, same lang as frontend |
| Database      | PostgreSQL 16 + TimescaleDB          | Relations + efficient time-series     |
| Cache / Queue | Redis + BullMQ                       | Token refresh, sync jobs, rate limits |
| Auth          | Supabase Auth (JWT)                  | Ready-made + RLS policies             |
| Infra (dev)   | Docker Compose                       | Local parity with production          |

## Monorepo structure

```
athleteos/
├── apps/
│   ├── api/            NestJS backend
│   │   └── src/
│   │       ├── auth/
│   │       ├── users/
│   │       ├── connected-accounts/   OAuth flows + token encryption
│   │       ├── sync/                 Strava + WHOOP adapters + BullMQ jobs
│   │       ├── activities/
│   │       ├── recovery/
│   │       ├── metrics/              Readiness score calculation
│   │       ├── recommendations/      Rule engine
│   │       ├── insights/             Improvement insight detection
│   │       ├── webhooks/             Strava + WHOOP event listeners
│   │       └── dashboard/            Aggregated dashboard endpoints
│   └── web/            Next.js frontend
│       └── src/
│           ├── app/
│           │   ├── today/            Main daily dashboard
│           │   ├── week/             Weekly plan + load chart
│           │   ├── recovery/         HRV + sleep + ATL/CTL charts
│           │   ├── activity/[id]/    Activity detail
│           │   └── profile/          Settings + connected accounts
│           ├── components/
│           │   ├── layout/           Sidebar, TopBar
│           │   ├── today/            ReadinessCard, RecommendationCard, etc.
│           │   ├── week/             WeeklyLoadChart, WeekPlanGrid
│           │   ├── recovery/         HRVTrendChart, SleepBreakdownChart
│           │   └── providers/        QueryProvider
│           └── hooks/                useApi.ts (TanStack Query)
├── packages/
│   ├── types/          Shared TypeScript interfaces (domain entities + DTOs)
│   ├── utils/          Training calculations (TSS, ATL, CTL, zones, readiness)
│   └── mocks/          Strava + WHOOP mock data for development
├── infra/
│   ├── docker-compose.yml
│   └── init.sql        Full schema + TimescaleDB + RLS policies
├── .env.example
├── turbo.json
└── README.md
```

## Prerequisites

- Node.js 20+
- Docker + Docker Compose
- pnpm 9+ (or npm 10+)

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/your-org/athleteos
cd athleteos
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your values (Supabase keys, etc.)
# For local dev, ENABLE_STRAVA_MOCK=true and ENABLE_WHOOP_MOCK=true work out of the box

# 3. Start infrastructure
cd infra && docker compose up -d && cd ..

# 4. Run database migrations
pnpm db:migrate

# 5. Seed with 90 days of mock athlete data
pnpm db:seed

# 6. Start all apps
pnpm dev

# Apps running at:
# → Frontend:  http://localhost:3001
# → API:       http://localhost:3000
# → Swagger:   http://localhost:3000/api/docs
```

## Environment variables

See `.env.example` for the full list. Critical ones:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `ENCRYPTION_KEY` | 64-char hex key for AES-256-GCM token encryption |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase key |
| `STRAVA_CLIENT_ID` / `_SECRET` | From Strava API settings |
| `WHOOP_CLIENT_ID` / `_SECRET` | From WHOOP Developer Portal |
| `ENABLE_STRAVA_MOCK` | `true` to use mock data (no real Strava account needed) |
| `ENABLE_WHOOP_MOCK` | `true` to use mock data (no real WHOOP account needed) |

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## API endpoints

Full docs at `http://localhost:3000/api/docs` (Swagger UI).

Key endpoints:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/dashboard/today` | Today's readiness + recommendation + insights |
| `GET` | `/api/v1/dashboard/week` | Weekly plan + load breakdown |
| `GET` | `/api/v1/connected-accounts` | List connected providers |
| `GET` | `/api/v1/connected-accounts/strava/connect` | Get Strava OAuth URL |
| `GET` | `/api/v1/connected-accounts/strava/callback` | Strava OAuth callback |
| `GET` | `/api/v1/connected-accounts/whoop/connect` | Get WHOOP OAuth URL |
| `GET` | `/api/v1/connected-accounts/whoop/callback` | WHOOP OAuth callback |
| `DELETE` | `/api/v1/connected-accounts/:provider` | Disconnect provider |
| `GET` | `/api/v1/activities` | Paginated activity list |
| `GET` | `/api/v1/recovery` | Recovery sessions + sleep metrics |
| `PATCH` | `/api/v1/recommendations/:id` | Mark session done/skipped |
| `POST` | `/api/v1/sync/:provider` | Trigger manual sync |
| `POST` | `/api/v1/webhooks/strava` | Strava webhook listener |
| `POST` | `/api/v1/webhooks/whoop` | WHOOP webhook listener |

## Recommendation engine

The rule engine (`apps/api/src/recommendations/recommendation-engine.ts`) applies rules in priority order:

| Rule | Condition | Output |
|---|---|---|
| R001 | TSB < -35 or 6+ consecutive high-load days | Complete rest |
| R002 | Readiness score < 35 | Recovery session only |
| R003 | Friday + 3+ hard days this week | Easy or rest |
| R004 | Within 2 weeks of race goal | Taper protocol |
| R005 | Score < 55 or TSB < -15 | Z2 endurance |
| R006 | Score ≥ 70 + FTP goal | Threshold intervals |
| R007 | Score ≥ 70 + race prep goal | VO2max session |
| R008 | Score ≥ 82 (optimal) | Best session for goal |
| R009 | Default | Moderate endurance |

Readiness score formula:
```
Score = HRV_component × 0.35 + Sleep_component × 0.30 + Load_component × 0.25 + Trend × 0.10
```

## OAuth token security

Tokens are **never stored in plaintext**. Flow:
1. User initiates OAuth → backend generates state with userId
2. Provider redirects back with code → backend exchanges for tokens
3. Tokens encrypted with AES-256-GCM before DB storage
4. Decrypted only in `ConnectedAccountsService.getValidAccessToken()` for API calls
5. Frontend never sees raw tokens

## Data normalization

Each provider has an adapter that maps raw data to our schema:

| Provider | Training Load | Recovery | Notes |
|---|---|---|---|
| Strava | TSS (power) or HR-TRIMP | ❌ | Webhooks for real-time |
| WHOOP | Strain → normalized TSS | Recovery score, HRV | Webhooks for real-time |
| Garmin | Training Effect → normalized | HRV, sleep | V2 — needs API approval |

## Running tests

```bash
# All tests
pnpm test

# Backend unit tests
pnpm test --filter=@athleteos/api

# Watch mode
pnpm test:watch --filter=@athleteos/api

# Coverage
pnpm test:cov --filter=@athleteos/api
```

## Deployment

**Backend (Railway/Render):**
```bash
# Build
pnpm build --filter=@athleteos/api

# Start
node apps/api/dist/main.js
```

**Frontend (Vercel):**
- Connect repo → set root directory to `apps/web`
- Add all env vars from `.env.example`
- Vercel auto-detects Next.js

**Database (Supabase):**
- Create project → run `infra/init.sql` in SQL editor
- Enable TimescaleDB extension in Supabase dashboard

## Security checklist

- [x] AES-256-GCM encryption for all OAuth tokens
- [x] Tokens never logged or exposed to frontend
- [x] Helmet + CORS configured on API
- [x] Input validation on all endpoints (class-validator)
- [x] Rate limiting (100 req/min)
- [x] Row Level Security on all tables
- [x] GDPR: user data deletion endpoint
- [x] Nutrition disclaimer on all recommendations

## Disclaimers

AthleteOS recommendations are **orientative only** and based on wearable sensor data. They do not constitute medical, nutritional, or professional training advice. Consult a qualified professional before making significant changes to your training or nutrition.

HRV, recovery scores, and readiness metrics are estimates derived from consumer wearables and may not accurately reflect your actual physiological state.

## License

MIT
