import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { QueryProvider } from '@/components/providers/QueryProvider'

export const metadata: Metadata = {
  title: { template: '%s — AthleteOS', default: 'AthleteOS' },
  description: 'Fitness intelligence platform for endurance athletes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{
              flex: 1,
              padding: '2rem',
              maxWidth: '1200px',
              overflowX: 'hidden',
            }}>
              {children}
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  )
}
