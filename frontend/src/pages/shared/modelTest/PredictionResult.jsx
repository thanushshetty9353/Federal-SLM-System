import { motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, Zap, Brain, Target, Clock } from 'lucide-react'

const CONFIDENCE_COLOR = (c) => {
  if (c >= 0.85) return '#10B981'
  if (c >= 0.65) return '#F59E0B'
  return '#EF4444'
}

const pct = (c) => `${Math.round(c * 100)}%`

export default function PredictionResult({ result }) {
  if (!result) return null

  const { prediction, confidence, model_name, model_format, target_field } = result
  const confColor  = CONFIDENCE_COLOR(confidence)
  const confPct    = Math.round(confidence * 100)
  const isHighConf = confidence >= 0.85

  return (
    <motion.div
      key={prediction + confidence}
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1,  y: 0  }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{
        borderRadius: 20,
        background:   'linear-gradient(135deg, rgba(15,22,38,0.95), rgba(20,29,46,0.95))',
        border:       `1px solid ${confColor}44`,
        boxShadow:    `0 0 32px ${confColor}22, 0 8px 32px rgba(0,0,0,0.4)`,
        overflow:     'hidden',
        position:     'relative',
      }}
    >
      {/* Animated glow top bar */}
      <div style={{
        height: 3,
        background: `linear-gradient(90deg, transparent, ${confColor}, transparent)`,
        animation: 'shimmer 2s infinite',
      }} />

      {/* Radial glow bg */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 0%, ${confColor}10 0%, transparent 65%)`,
      }} />

      <div style={{ padding: 28, position: 'relative' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 42, height: 42, borderRadius: 12,
              background: `linear-gradient(135deg, ${confColor}25, ${confColor}10)`,
              border: `1px solid ${confColor}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Brain size={20} color={confColor} />
          </motion.div>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Prediction Result
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 1 }}>
              via <span style={{ color: confColor, fontWeight: 600 }}>{model_name || 'Uploaded Model'}</span>
            </p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            {isHighConf
              ? <span className="badge badge-green"><CheckCircle size={9} /> High Confidence</span>
              : <span className="badge badge-orange"><AlertTriangle size={9} /> Low Confidence</span>
            }
          </div>
        </div>

        {/* Main prediction */}
        <div style={{
          padding: '18px 22px', borderRadius: 14,
          background: `${confColor}0E`, border: `1px solid ${confColor}25`,
          marginBottom: 20, textAlign: 'center',
        }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <Target size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            {target_field || 'Prediction'}
          </p>
          <motion.p
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            style={{
              fontSize: 38, fontWeight: 900, color: confColor,
              letterSpacing: '-0.01em', lineHeight: 1,
              textShadow: `0 0 24px ${confColor}66`,
            }}
          >
            {prediction}
          </motion.p>
        </div>

        {/* Confidence bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Zap size={12} color={confColor} /> Confidence
            </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: confColor }}>{pct(confidence)}</span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${confPct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              style={{
                height: '100%', borderRadius: 4,
                background: `linear-gradient(90deg, ${confColor}88, ${confColor})`,
                boxShadow: `0 0 10px ${confColor}66`,
              }}
            />
          </div>
        </div>

        {/* Meta info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { label: 'Model',  value: model_name || '—', color: 'var(--neon-blue)' },
            { label: 'Format', value: `.${model_format || '—'}`, color: 'var(--neon-purple)' },
            { label: 'Target', value: target_field || '—', color: '#EF4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              padding: '10px 12px', borderRadius: 10,
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
              <p style={{ fontSize: 12, fontWeight: 700, color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
