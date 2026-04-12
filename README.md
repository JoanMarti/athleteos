# AthleteOS

**Plataforma web full-stack** para atletas de resistencia que unifica Strava, WHOOP, Garmin, Suunto, Wahoo, Intervals.icu y TrainingPeaks en un único motor de inteligencia deportiva.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Auth | Supabase Auth — email, Google, Apple |
| Base de datos | Supabase (PostgreSQL) con RLS |
| Estado global | Zustand + TanStack Query |
| Gráficas | Recharts |
| Tipografía | Outfit + JetBrains Mono |
| Monorepo | Turborepo |

## Estructura del proyecto

```
athleteos/
├── apps/
│   └── web/                    # Next.js 14 app
│       └── src/
│           ├── app/
│           │   ├── (auth)/     # Login, signup (sin sidebar)
│           │   ├── (app)/      # App autenticada con sidebar
│           │   │   ├── app/    # Dashboard "Hoy"
│           │   │   ├── week/   # Vista semanal + ATL/CTL/TSB
│           │   │   ├── recovery/  # HRV, sueño, recovery score
│           │   │   ├── activities/ # Lista de actividades
│           │   │   └── profile/    # Perfil + métricas + integraciones
│           │   ├── onboarding/ # Wizard 5 pasos
│           │   └── api/
│           │       ├── integrations/
│           │       │   ├── [provider]/auth-url/  # OAuth URL generator
│           │       │   ├── [provider]/callback/  # OAuth callback
│           │       │   ├── strava/sync/           # Sync Strava activities
│           │       │   ├── whoop/sync/            # Sync WHOOP recovery
│           │       │   ├── intervals/sync/        # Sync Intervals.icu
│           │       │   └── connect/               # API key connect (Intervals)
│           │       ├── metrics/calculate/         # ATL/CTL/TSB/Readiness
│           │       ├── recommendations/generate/  # Rule engine
│           │       └── webhooks/strava/           # Strava webhook listener
│           ├── components/
│           │   ├── layout/     # AppSidebar (desktop + mobile bottom nav)
│           │   ├── dashboard/  # ReadinessCard, RecommendationCard, etc.
│           │   ├── week/       # WeeklyLoadChart, WeekPlanGrid, ATLCTLChart
│           │   ├── recovery/   # HRVTrendChart, SleepBreakdownChart
│           │   ├── activities/ # ActivityList con filtros y detalle expandible
│           │   ├── profile/    # IntegrationsPanel, AthleteMetricsPanel
│           │   └── providers/  # AppProviders (QueryClient + AuthInit)
│           ├── stores/         # Zustand: authStore
│           ├── lib/            # Supabase client helpers
│           └── middleware.ts   # Route protection
│
├── packages/
│   ├── types/                  # Tipos compartidos: providers, entidades, DTOs
│   └── utils/                  # Cálculos: TSS, ATL, CTL, zonas, readiness
│
└── supabase/
    └── migrations/             # Schema completo con RLS
```

## Integraciones soportadas

| Proveedor | Auth | Actividades | Recuperación | HRV |
|---|---|---|---|---|
| **Strava** | OAuth 2 | ✅ | ❌ | ❌ |
| **WHOOP** | OAuth 2 | ❌ | ✅ | ✅ |
| **Garmin** | OAuth 2 | ✅ | ✅ | ✅ |
| **Suunto** | OAuth 2 | ✅ | ❌ | ❌ |
| **Wahoo** | OAuth 2 | ✅ | ❌ | ❌ |
| **Intervals.icu** | API Key | ✅ | ❌ | ❌ |
| **TrainingPeaks** | OAuth 2 | ✅ | ❌ | ❌ |
| Polar | OAuth 2 | ✅ | ✅ | ✅ |
| COROS | OAuth 2 | ✅ | ❌ | ❌ |

> Garmin, Suunto, TrainingPeaks, Polar y COROS requieren aprobación comercial de la API.

## Setup rápido

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus claves de Supabase y providers

# 3. Aplicar schema en Supabase
# Copiar supabase/migrations/001_initial_schema.sql
# Ejecutar en el SQL Editor de Supabase Dashboard

# 4. Iniciar en desarrollo
pnpm dev
# → http://localhost:3000
```

## Variables de entorno clave

```env
NEXT_PUBLIC_SUPABASE_URL=         # URL de tu proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Anon key pública
SUPABASE_SERVICE_ROLE_KEY=        # Service role (solo servidor)
ENCRYPTION_KEY=                   # 64 char hex para AES-256-GCM
STRAVA_CLIENT_ID=                 # App Strava en developers.strava.com
STRAVA_CLIENT_SECRET=
WHOOP_CLIENT_ID=                  # App WHOOP en developer.whoop.com
WHOOP_CLIENT_SECRET=
```

Genera ENCRYPTION_KEY:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Autenticación

- Email + contraseña
- Google OAuth (configurar en Supabase Dashboard → Auth → Providers)
- Apple OAuth (configurar en Supabase Dashboard → Auth → Providers)
- Flujo: registro → email de confirmación → onboarding (5 pasos) → dashboard

## Motor de recomendaciones

9 reglas en orden de prioridad:

| Regla | Condición | Resultado |
|---|---|---|
| R001 | TSB < -35 o 6+ días consecutivos de carga alta | Descanso obligatorio |
| R002 | Readiness < 35 o etiqueta "rest_day" | Solo recuperación activa |
| R003 | Viernes + 3+ días duros | Descarga deliberada |
| R004 | ≤2 semanas para carrera | Tapering |
| R005 | Readiness < 55 o TSB < -15 | Endurance Z2 |
| R006 | Readiness ≥ 70 + objetivo FTP | Intervalos de umbral |
| R007 | Readiness ≥ 70 + prep. carrera | VO2max |
| R008 | Fin de semana + readiness ≥ 75 | Salida larga |
| R009 | Default | Aeróbico moderado |

## Seguridad

- Tokens OAuth cifrados con AES-256-GCM antes de guardar en DB
- Row Level Security activo en todas las tablas
- JWT validado en middleware para todas las rutas `/app/*`
- Tokens nunca expuestos al cliente
- Disclaimer en todas las recomendaciones nutricionales

## Responsive

- Desktop: sidebar fijo izquierdo (240px)
- Mobile (≤768px): sidebar oculto, bottom navigation fija con 5 iconos
- Grids adaptivos: 4col → 2col → 1col según breakpoint

## Disclaimer

Las recomendaciones de AthleteOS son orientativas y basadas en datos de wearables. No constituyen asesoramiento médico o nutricional profesional.
