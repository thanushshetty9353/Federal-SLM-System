import { motion } from 'framer-motion'

export function Loader({ size = 'md', label }) {
  const sizes = { sm: 24, md: 40, lg: 60 }
  const s = sizes[size] || 40
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: s, height: s,
          borderRadius: '50%',
          border: `3px solid rgba(0,212,255,0.15)`,
          borderTopColor: '#00D4FF',
          boxShadow: '0 0 16px rgba(0,212,255,0.3)',
        }}
      />
      {label && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>}
    </div>
  )
}

export function SkeletonLine({ width = '100%', height = 16 }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: 8 }} />
  )
}

export function SkeletonCard() {
  return (
    <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SkeletonLine width="40%" height={12} />
      <SkeletonLine width="70%" height={28} />
      <SkeletonLine width="55%" height={12} />
    </div>
  )
}
