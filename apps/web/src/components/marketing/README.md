# Marketing Components

Landing page sections for AthleteOS public marketing site.

## Route
`/` — served from `apps/web/src/app/(marketing)/page.tsx`
The `(marketing)` route group excludes the authenticated sidebar layout.

## Sections

| Component | Description |
|---|---|
| `MarketingNav` | Sticky top nav with logo + CTA |
| `HeroSection` | Headline, subhead, CTA buttons, source chips |
| `StatsRow` | 4-column stat strip (readiness, rules, history, speed) |
| `DashboardPreview` | Live dashboard mockup with readiness ring + recommendation card |
| `FeaturesGrid` | 3×2 feature grid |
| `HowItWorks` | 4-step horizontal flow |
| `PricingSection` | 3-column pricing cards (Starter / Pro / Team) |
| `TestimonialsSection` | 3-column athlete testimonials |
| `FaqSection` | Accordion FAQ (5 questions) |
| `CtaSection` | Bottom CTA with disclaimer |
| `MarketingFooter` | Logo + links + copyright |

## Design tokens
Dark-first. Accent: `#00e5b4`. All tokens in `globals.css`.

## Adding to GitHub Pages or Vercel
The landing page is a standard Next.js static page.
Set `NEXT_PUBLIC_APP_URL` in Vercel env vars for CTA button routing.
