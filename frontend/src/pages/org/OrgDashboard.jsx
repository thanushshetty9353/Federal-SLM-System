import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Brain, Download, Link2, Upload, CheckCircle, Clock } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import GlassCard from '../../components/ui/GlassCard'
import { SkeletonCard } from '../../components/ui/Loader'
import { useAuth } from '../../context/AuthContext'


export default function OrgDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  const stats = []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '20px 24px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(139,92,246,0.12))', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            Welcome back, <span className="text-gradient">Org {user?.org_id || '—'}</span>
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your federated node is active and contributing to the global model.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', animation: 'glow-pulse 2s infinite' }} />
            <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700 }}>Node Active</span>
          </div>
        </div>
      </motion.div>


    </div>
  )
}
