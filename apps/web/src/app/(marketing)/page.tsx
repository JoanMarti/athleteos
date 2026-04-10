import type { Metadata } from 'next'
import { HeroSection } from '@/components/marketing/HeroSection'
import { StatsRow } from '@/components/marketing/StatsRow'
import { DashboardPreview } from '@/components/marketing/DashboardPreview'
import { FeaturesGrid } from '@/components/marketing/FeaturesGrid'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { PricingSection } from '@/components/marketing/PricingSection'
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection'
import { FaqSection } from '@/components/marketing/FaqSection'
import { CtaSection } from '@/components/marketing/CtaSection'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

export const metadata: Metadata = {
  title: 'AthleteOS — Todos tus datos deportivos. Una sola inteligencia.',
  description: 'Unifica Strava y WHOOP en un motor de recomendaciones que te dice exactamente qué hacer hoy. Readiness score, plan semanal adaptativo y detección de sobreentrenamiento.',
  openGraph: {
    title: 'AthleteOS',
    description: 'Inteligencia deportiva para atletas de resistencia',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <div style={{ background: '#09090b', minHeight: '100vh', color: '#f4f4f5' }}>
      <MarketingNav />
      <HeroSection />
      <StatsRow />
      <DashboardPreview />
      <FeaturesGrid />
      <HowItWorks />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
      <MarketingFooter />
    </div>
  )
}
