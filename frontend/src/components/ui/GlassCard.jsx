import { motion } from 'framer-motion'

export default function GlassCard({ children, className = '', hover = false, neon, style = {}, onClick }) {
  const hoverClass = hover ? 'glass-card-hover' : ''
  const neonClass = neon === 'blue' ? 'neon-glow-blue' : neon === 'purple' ? 'neon-glow-purple' : neon === 'green' ? 'neon-glow-green' : ''
  return (
    <motion.div
      className={`glass-card ${hoverClass} ${neonClass} ${className}`}
      style={{ padding: 24, ...style }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
