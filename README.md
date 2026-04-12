# AthleteOS

> Plataforma web full-stack de inteligencia deportiva para atletas de resistencia.

Unifica datos de **Strava, WHOOP, Garmin, Suunto, Wahoo, Intervals.icu y TrainingPeaks** en un único dashboard con motor de recomendaciones, readiness score diario, análisis ATL/CTL/TSB y seguimiento de recuperación.

---

## Índice

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración de Supabase](#configuración-de-supabase)
- [Variables de entorno](#variables-de-entorno)
- [Configuración de integraciones](#configuración-de-integraciones)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Rutas de la aplicación](#rutas-de-la-aplicación)
- [API endpoints](#api-endpoints)
- [Motor de recomendaciones](#motor-de-recomendaciones)
- [Integraciones soportadas](#integraciones-soportadas)
- [Seguridad](#seguridad)
- [Despliegue](#despliegue)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## Características

### Autenticación
- Email y contraseña con confirmación por email
- Login social con **Google** y **Apple** vía Supabase Auth
- Protección de rutas mediante middleware Next.js
- Onboarding guiado de 5 pasos al registrarse por primera vez

### Dashboard diario
- **Readiness score** (0–100) calculado a partir de HRV, sueño, carga acumulada (ATL/CTL/TSB) y tendencia de recuperación
- Recomendación del día generada por el motor de reglas (9 reglas priorizadas)
- Resumen de la última actividad con distribución de zonas de FC y potencia
- Progreso de carga semanal: TSS planificado vs. real
- Estimación nutricional orientativa (calorías, macros)
- Feed de insights automáticos: sobreentrenamiento, PRs, eficiencia aeróbica

### Vista semanal
- Gráfico de carga planificada vs. real por día (Recharts)
- Plan en grid visual con tipo de sesión y TSS por día
- Desglose por deporte: ciclismo, running, natación, fuerza
- Gráfico ATL/CTL/TSB de los últimos 30 días

### Recuperación
- Tendencia de HRV (RMSSD) 30 días con media y bandas
- Fases del sueño 14 noches (profundo, REM, ligero, despierto) en gráfico apilado
- Historial de recovery score con bandas verde/amarillo/rojo

### Perfil del atleta
- Métricas: FTP, LTHR, ritmo de umbral, FC máxima, FC reposo, W', VO2max, peso, altura
- **Zonas de potencia** calculadas automáticamente con el modelo Coggan (6 zonas) a partir del FTP
- **Zonas de FC** calculadas con el modelo Friel (5 zonas) a partir de LTHR o FC máx
- W/kg calculado en tiempo real al introducir FTP y peso
- Gestor de objetivos con 7 tipos: FTP, carrera, base aeróbica, tiempo, pérdida de grasa, VO2max, fitness general
- Panel de información personal: nombre, bio, país, zona horaria

### Panel de integraciones
- Estado de conexión de cada proveedor con indicador visual
- Botón de sync manual + timestamp de última sincronización
- OAuth 2.0 para todos los proveedores con tokens cifrados AES-256-GCM
- API Key para Intervals.icu (sin OAuth)
- Webhook listener para Strava (sincronización en tiempo real < 5 segundos)

### Responsive
- **Desktop**: sidebar fija izquierda (240px)
- **Mobile** (≤768px): sidebar oculta, bottom navigation fija con 5 tabs

---

## Stack tecnológico

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR, API routes integradas, middleware, Vercel deploy |
| Lenguaje | TypeScript estricto | Tipos compartidos entre frontend y API |
| Auth | Supabase Auth | JWT, OAuth social, confirmación de email, RLS |
| Base de datos | Supabase (PostgreSQL) | Relacional, RLS por fila, triggers automáticos |
| Estado global | Zustand | Ligero, sin boilerplate, bien tipado |
| Data fetching | TanStack Query v5 | Cache automático, revalidación, estados de carga |
| Gráficas | Recharts | Composable, responsive, tipado con TypeScript |
| Estilos | CSS custom properties + Tailwind | Design system propio, dark-first, sin dependencias de UI |
| Tipografía | Outfit + JetBrains Mono | Display deportivo + monoespaciado para métricas numéricas |
| Monorepo | Turborepo + pnpm workspaces | Build incremental, paquetes de tipos y utils compartidos |
| CI | GitHub Actions | Type-check + lint + build automático en cada push |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Edge Network)                 │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Next.js 14 App Router              │    │
│  │                                                  │    │
│  │  /(auth)        /(app)          /api             │    │
│  │  login          dashboard       integrations/    │    │
│  │  signup         week            metrics/         │    │
│  │  onboarding     recovery        recommendations/ │    │
│  │                 activities      webhooks/        │    │
│  │                 profile                          │    │
│  └──────────────────────┬──────────────────────────┘    │
└─────────────────────────┼───────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
    ┌─────▼──────┐  ┌─────▼──────┐  ┌────▼─────┐
    │  Supabase  │  │  Strava    │  │  WHOOP   │
    │ (Postgres  │  │  API v3    │  │  API v1  │
    │  + Auth    │  │  + webhook │  │          │
    │  + RLS)    │  └────────────┘  └──────────┘
    └────────────┘
```

**Flujo de datos:**
1. Usuario conecta un proveedor → OAuth callback → token cifrado guardado en Supabase
2. Strava envía webhook al crear actividad → `/api/webhooks/strava` → sync automático
3. WHOOP sincroniza recovery + sleep diariamente o bajo demanda
4. `/api/metrics/calculate` calcula ATL/CTL/TSB/Readiness a partir de los datos guardados
5. `/api/recommendations/generate` aplica las 9 reglas y guarda la recomendación del día
6. El dashboard lee los datos calculados desde Supabase via Server Components

---

## Requisitos previos

- **Node.js** 20 o superior
- **pnpm** 9 o superior — instalar con `npm install -g pnpm`
- Cuenta en [Supabase](https://supabase.com) — el plan gratuito es suficiente para desarrollo
- Al menos una app de proveedor configurada — Strava es la más sencilla para empezar

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/athleteos.git
cd athleteos

# 2. Instalar dependencias de todos los workspaces
pnpm install

# 3. Copiar el archivo de variables de entorno
cp .env.example .env

# 4. Editar .env con tus credenciales
# (ver sección "Variables de entorno" más abajo)

# 5. Iniciar en modo desarrollo
pnpm dev

# La app estará disponible en http://localhost:3000
```

---

## Configuración de Supabase

### 1. Crear proyecto

Ve a [supabase.com](https://supabase.com), crea un nuevo proyecto y anota estos valores para el `.env`:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (en Settings → API)

### 2. Ejecutar el schema

En el **SQL Editor** de tu proyecto Supabase, copia y ejecuta el contenido completo de:

```
supabase/migrations/001_initial_schema.sql
```

Este script crea:
- Todas las tablas (profiles, athlete_profiles, connected_integrations, training_sessions, recovery_data, sleep_data, daily_metrics, daily_recommendations, insights, nutrition_recommendations, goals)
- Índices de rendimiento
- Políticas RLS para aislamiento de datos por usuario
- Trigger que crea el perfil de atleta automáticamente al registrarse

### 3. Configurar proveedores de login social (opcional)

En tu proyecto Supabase → **Authentication → Providers**:

**Google:**
1. Activa Google
2. Crea credenciales OAuth en [Google Cloud Console](https://console.cloud.google.com) con redirect URI: `https://TU-PROYECTO.supabase.co/auth/v1/callback`
3. Pega Client ID y Client Secret en Supabase

**Apple:**
1. Activa Apple
2. Requiere Apple Developer Account ($99/año)
3. Crea un Services ID en [developer.apple.com](https://developer.apple.com)
4. Añade el redirect URI de Supabase como dominio autorizado

---

## Variables de entorno

Todas las variables necesarias están documentadas en `.env.example`. Las obligatorias para empezar son:

```env
# Supabase — obligatorio
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Encriptación de tokens — obligatorio
# Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# URL de la app
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Strava — mínimo recomendado para empezar
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_WEBHOOK_VERIFY_TOKEN=elige-un-token-secreto

# WHOOP — opcional, para datos de recuperación y HRV
WHOOP_CLIENT_ID=
WHOOP_CLIENT_SECRET=
```

Las credenciales de Garmin, Suunto, Wahoo, TrainingPeaks y Polar pueden dejarse vacías hasta que los necesites.

---

## Configuración de integraciones

### Strava

1. Ve a [strava.com/settings/api](https://www.strava.com/settings/api)
2. Crea una aplicación
3. En **Authorization Callback Domain** escribe `localhost` para desarrollo o tu dominio para producción
4. Copia **Client ID** y **Client Secret** al `.env`

Para registrar el webhook en producción:
```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=TU_CLIENT_ID \
  -F client_secret=TU_CLIENT_SECRET \
  -F callback_url=https://tu-dominio.com/api/webhooks/strava \
  -F verify_token=TU_WEBHOOK_VERIFY_TOKEN
```

### WHOOP

1. Solicita acceso en [developer.whoop.com](https://developer.whoop.com) — puede tardar unos días
2. Crea una aplicación OAuth
3. Redirect URI: `http://localhost:3000/api/integrations/whoop/callback` (dev) o tu dominio (prod)
4. Copia las credenciales al `.env`

### Intervals.icu

No requiere OAuth. El usuario introduce su API key directamente en el panel de integraciones de la app:
1. Ve a intervals.icu → Settings → Developer Settings
2. Copia la API Key
3. En AthleteOS → Perfil → Integraciones → Intervals.icu → Conectar

### Garmin, Suunto, Wahoo, TrainingPeaks

Requieren solicitar acceso directamente con el proveedor:
- **Garmin Health API**: [developer.garmin.com](https://developer.garmin.com/health-api/overview/) — aprobación comercial
- **Suunto**: [www.suunto.com/api](https://www.suunto.com/api)
- **Wahoo**: [developers.wahooligan.com](https://developers.wahooligan.com)
- **TrainingPeaks**: [developer.trainingpeaks.com](https://developer.trainingpeaks.com) — aprobación de partner

---

## Scripts disponibles

Desde la raíz del monorepo:

```bash
pnpm dev          # Inicia todos los workspaces en modo desarrollo
pnpm build        # Compila todos los workspaces
pnpm type-check   # Type-check en todos los workspaces
pnpm lint         # Lint en todos los workspaces
```

Desde `apps/web` directamente:

```bash
pnpm dev          # Solo el frontend en localhost:3000
pnpm build        # Build de producción
pnpm start        # Servidor de producción
```

---

## Estructura del proyecto

```
athleteos/
├── .github/
│   └── workflows/ci.yml            # CI: type-check + lint + build
│
├── apps/
│   └── web/                        # Next.js 14 — aplicación principal
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── src/
│           ├── app/
│           │   ├── (auth)/         # Rutas públicas sin sidebar
│           │   │   ├── login/      # Email + Google + Apple
│           │   │   └── signup/     # Registro con confirmación
│           │   │
│           │   ├── (app)/          # Rutas protegidas con sidebar
│           │   │   ├── layout.tsx  # Verifica sesión + onboarding completo
│           │   │   ├── app/        # Dashboard "Hoy"
│           │   │   ├── week/       # Vista semanal + ATL/CTL/TSB
│           │   │   ├── recovery/   # HRV, sueño, recovery score
│           │   │   ├── activities/ # Lista de actividades con filtros
│           │   │   └── profile/    # Perfil, métricas, integraciones, objetivos
│           │   │
│           │   ├── onboarding/     # Wizard 5 pasos (tras registro)
│           │   ├── auth/callback/  # Handler callback OAuth Supabase
│           │   ├── layout.tsx      # Root layout con importación de fuentes
│           │   ├── globals.css     # Design system completo (CSS variables)
│           │   │
│           │   └── api/
│           │       ├── integrations/
│           │       │   ├── [provider]/auth-url/  # Genera URL OAuth por proveedor
│           │       │   ├── [provider]/callback/  # Intercambia code → guarda token cifrado
│           │       │   ├── connect/              # Conecta proveedor por API key
│           │       │   ├── strava/sync/          # Importa actividades Strava (30d)
│           │       │   ├── whoop/sync/           # Importa recovery + sleep WHOOP
│           │       │   └── intervals/sync/       # Importa actividades Intervals.icu
│           │       ├── metrics/calculate/        # Calcula ATL/CTL/TSB/Readiness del día
│           │       ├── recommendations/generate/ # Motor de recomendaciones (9 reglas)
│           │       └── webhooks/strava/          # Listener webhook tiempo real
│           │
│           ├── components/
│           │   ├── layout/AppSidebar.tsx         # Sidebar desktop + bottom nav mobile
│           │   ├── dashboard/                    # ReadinessCard, RecommendationCard,
│           │   │                                 #   LastActivityCard, WeeklySummary,
│           │   │                                 #   InsightsFeed, NutritionCard
│           │   ├── week/                         # WeeklyLoadChart, WeekPlanGrid,
│           │   │                                 #   SportBreakdown, ATLCTLChart
│           │   ├── recovery/                     # HRVTrendChart, SleepBreakdownChart,
│           │   │                                 #   RecoveryScoreHistory
│           │   ├── activities/ActivityList.tsx   # Lista expandible con filtros
│           │   ├── profile/                      # IntegrationsPanel, AthleteMetricsPanel,
│           │   │                                 #   PersonalInfoPanel
│           │   └── providers/AppProviders.tsx    # QueryClient + inicialización de auth
│           │
│           ├── stores/authStore.ts    # Zustand: sesión, perfil, acciones de auth
│           ├── lib/supabase.ts        # Clients Supabase: browser, server, middleware
│           └── middleware.ts          # Protección de rutas /app/* y /onboarding
│
├── packages/
│   ├── types/src/index.ts   # Tipos compartidos: Provider, TrainingSession, AthleteProfile...
│   └── utils/src/index.ts   # Cálculos: TSS, ATL, CTL, zonas HR/potencia, readiness, formato
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql   # Schema completo + RLS + triggers
│
├── .env.example             # Plantilla con todas las variables documentadas
├── .gitignore
├── .prettierrc
├── package.json             # Root workspace — Turborepo
├── turbo.json               # Pipeline de compilación
└── tsconfig.json            # TypeScript base compartido
```

---

## Rutas de la aplicación

| Ruta | Descripción | Acceso |
|---|---|---|
| `/login` | Iniciar sesión (email, Google, Apple) | Público |
| `/signup` | Crear cuenta nueva | Público |
| `/auth/callback` | Handler callback OAuth Supabase | Público |
| `/onboarding` | Wizard de configuración inicial | Requiere auth |
| `/app` | Dashboard diario con readiness y recomendación | Requiere auth + onboarding |
| `/app/week` | Vista semanal con carga y plan | Requiere auth + onboarding |
| `/app/recovery` | HRV, sueño y recovery score | Requiere auth + onboarding |
| `/app/activities` | Lista de actividades sincronizadas | Requiere auth + onboarding |
| `/app/profile` | Perfil, métricas, integraciones y objetivos | Requiere auth + onboarding |

---

## API endpoints

### Integraciones

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/integrations/[provider]/auth-url` | Devuelve URL de autorización OAuth |
| `GET` | `/api/integrations/[provider]/callback` | Recibe code, intercambia tokens, guarda cifrado |
| `POST` | `/api/integrations/connect` | Conecta proveedor con API key (Intervals.icu) |
| `POST` | `/api/integrations/strava/sync` | Sincroniza actividades Strava (últimos 30 días) |
| `POST` | `/api/integrations/whoop/sync` | Sincroniza recovery + sleep WHOOP |
| `POST` | `/api/integrations/intervals/sync` | Sincroniza actividades Intervals.icu |

### Métricas y recomendaciones

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/metrics/calculate` | Calcula y guarda ATL/CTL/TSB/Readiness del día actual |
| `POST` | `/api/recommendations/generate` | Aplica reglas y guarda recomendación del día |

### Webhooks

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/webhooks/strava` | Verificación del challenge de suscripción Strava |
| `POST` | `/api/webhooks/strava` | Recibe eventos de actividad en tiempo real |

---

## Motor de recomendaciones

El motor evalúa 9 reglas en orden de prioridad. La primera que se cumple genera la sesión del día:

| Regla | Condición | Sesión generada |
|---|---|---|
| R001 | TSB < −35 o ≥ 6 días de carga alta consecutivos | Descanso completo obligatorio |
| R002 | Readiness < 35 o etiqueta `rest_day` | Solo recuperación activa Z1 (40 min) |
| R003 | Viernes + 3 o más días duros esa semana | Descarga deliberada Z2 (45 min) |
| R004 | ≤ 2 semanas para carrera (objetivo `race_preparation`) | Tapering |
| R005 | Readiness < 55 o TSB < −15 | Endurance aeróbico Z2 (70 min) |
| R006 | Readiness ≥ 70 + objetivo FTP + FTP configurado | Intervalos de umbral 5×8 min Z4 |
| R007 | Readiness ≥ 70 + objetivo carrera + TSB > −10 | Esfuerzos VO2max 6×3 min Z5 |
| R008 | Fin de semana + Readiness ≥ 75 | Salida o tirada larga Z2 (150 min) |
| R009 | Default — ninguna de las anteriores | Aeróbico moderado Z2 (60 min) |

**Fórmula del Readiness score:**
```
Score = HRV_component      × 0.35
      + Sleep_component     × 0.30
      + Load_component      × 0.25   ← basado en TSB
      + Recovery_trend      × 0.10
```

**Interpretación del TSB:**
- TSB > 10 → Fresco, preparado para carga alta
- TSB −10 a 10 → Balance normal
- TSB −20 a −10 → Fatiga manejable
- TSB < −20 → Alta fatiga, reducir intensidad
- TSB < −35 → Forzar descanso (R001)

---

## Integraciones soportadas

| Proveedor | Auth | Actividades | Recuperación | HRV | Estado |
|---|---|---|---|---|---|
| **Strava** | OAuth 2 | ✅ Power, HR, pace, zonas | ❌ | ❌ | Disponible |
| **WHOOP** | OAuth 2 | ❌ | ✅ Recovery score, sleep stages | ✅ RMSSD | Disponible — requiere aprobación |
| **Garmin** | OAuth 2 | ✅ Streams completos | ✅ Body Battery, SpO2 | ✅ | Disponible — requiere aprobación comercial |
| **Suunto** | OAuth 2 | ✅ | ❌ | ❌ | Disponible — requiere aprobación |
| **Wahoo** | OAuth 2 | ✅ | ❌ | ❌ | Disponible |
| **Intervals.icu** | API Key | ✅ TSS nativo, IF, zonas | ❌ | ❌ | Disponible — sin aprobación |
| **TrainingPeaks** | OAuth 2 | ✅ | ❌ | ❌ | Beta — requiere aprobación de partner |
| Polar | OAuth 2 | ✅ | ✅ | ✅ | Próximamente |
| COROS | OAuth 2 | ✅ | ❌ | ❌ | Próximamente |

---

## Seguridad

**Tokens OAuth**
Los tokens de acceso y refresco se cifran con **AES-256-GCM** antes de guardarse en la base de datos. Nunca se almacenan en texto plano y nunca se exponen al cliente.

```bash
# Generar ENCRYPTION_KEY de 32 bytes (64 caracteres hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Row Level Security**
RLS está activo en todas las tablas de Supabase. Cada usuario solo puede leer y escribir sus propios datos, incluso si se usara la `anon_key` pública directamente.

**Protección de rutas**
El middleware de Next.js valida el JWT de Supabase en cada request a `/app/*` y `/onboarding`. Las rutas sin sesión válida redirigen a `/login`.

**Trigger de DB**
El perfil de atleta se crea automáticamente mediante un trigger de PostgreSQL al registrarse, sin necesidad de exponer la `service_role_key` al cliente.

---

## Despliegue

### Vercel (recomendado)

1. Conecta el repositorio en [vercel.com](https://vercel.com)
2. Configura el **Root Directory** como `apps/web`
3. Añade todas las variables de entorno del `.env.example` en Vercel → Settings → Environment Variables
4. Vercel detecta Next.js automáticamente y configura el build

Actualiza estas variables para producción:
```env
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

Y actualiza los **redirect URIs** en cada proveedor OAuth para apuntar a tu dominio de producción.

### Manual

```bash
pnpm install
pnpm build
# Sirve desde apps/web con:
pnpm start --filter=@athleteos/web
```

---

## Contribuir

1. Haz fork del repositorio
2. Crea una rama descriptiva: `git checkout -b feat/integracion-polar`
3. Haz tus cambios
4. Commit siguiendo [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` nueva funcionalidad
   - `fix:` corrección de bug
   - `docs:` cambios en documentación
   - `refactor:` refactoring sin cambio funcional
   - `chore:` mantenimiento y dependencias
5. Push y abre un Pull Request describiendo los cambios

---

## Licencia

MIT — consulta el archivo [LICENSE](./LICENSE) para más detalles.

---

## Disclaimer

Las recomendaciones de AthleteOS son orientativas y están basadas en datos de wearables y sensores de consumo. No constituyen asesoramiento médico, nutricional ni de entrenamiento profesional. Consulta con un médico o entrenador cualificado antes de realizar cambios significativos en tu entrenamiento o alimentación.
