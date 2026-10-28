'use client'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface DayLoad {
  date: string
  planned: number
  actual: number
}

const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1f2124', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10, padding: '10px 14px', fontSize: 13,
    }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontSize: 11 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: p.color, marginBottom: 2 }}>
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{p.name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{p.value} TSS</span>
        </div>
      ))}
    </div>
  )
}

export function WeeklyLoadChart({ loadByDay }: { loadByDay: DayLoad[] }) {
  const data = loadByDay.map((d, i) => ({
    ...d,
    day: DAY_LABELS[i],
    isToday: new Date(d.date).toDateString() === new Date().toDateString(),
  }))

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Load — planned vs. actual
        </span>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(0,212,168,0.3)', border: '1.5px solid #00d4a8', display: 'inline-block' }} />
            Planned
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3dd68c', display: 'inline-block' }} />
            Actual
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'var(--font-mono)' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="planned" name="Planned" fill="rgba(0,212,168,0.15)" stroke="#00d4a8" strokeWidth={1.5} radius={[4,4,0,0]} />
          <Bar dataKey="actual"  name="Actual"  fill="#3dd68c" radius={[4,4,0,0]} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
