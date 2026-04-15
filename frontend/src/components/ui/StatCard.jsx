import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const accentMap = {
  blue:   { color: '#00D4FF', bg: 'rgba(0,212,255,0.08)',   border: 'rgba(0,212,255,0.2)' },
  purple: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
  green:  { color: '#10B981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)' },
  orange: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
  red:    { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)' },
}

export default function StatCard({ label, value, icon: Icon, accent = 'blue', trend, trendLabel, delay = 0 }) {
  const { color, bg, border } = accentMap[accent] || accentMap.blue
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? '#10B981' : trend < 0 ? '#EF4444' : '#8892A4'

  return (
    <motion.div
      className="glass-card glass-card-hover"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value ?? '—'}</p>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {Icon && <Icon size={20} color={color} />}
        </div>
      </div>
      {trendLabel !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendIcon size={13} color={trendColor} />
          <span style={{ fontSize: 12, color: trendColor, fontWeight: 600 }}>{trendLabel}</span>
        </div>
      )}
    </motion.div>
  )
}
