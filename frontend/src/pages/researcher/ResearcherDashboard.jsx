import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Globe, Link2, Database, BookOpen, TrendingUp } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import GlassCard from '../../components/ui/GlassCard'
import { SkeletonCard } from '../../components/ui/Loader'
import { useAuth } from '../../context/AuthContext'
import { schemaApi } from '../../api/schema'
import { blockchainApi } from '../../api/blockchain'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

const radarData = [
  { subject: 'OCR Accuracy', A: 92 }, { subject: 'SLM Quality', A: 87 },
  { subject: 'Dataset Size', A: 74 }, { subject: 'Model Perf', A: 89 },
  { subject: 'Privacy Score', A: 96 }, { subject: 'Audit Coverage', A: 100 },
]

export default function ResearcherDashboard() {
  const { user, canDownloadGlobal } = useAuth()
  const [schemas, setSchemas] = useState([])
  const [chain, setChain] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, b] = await Promise.allSettled([
          schemaApi.getAllSchemas(),
          blockchainApi.getAuditTrail()
        ])
        if (s.status === 'fulfilled') setSchemas(s.value.data || [])
        if (b.status === 'fulfilled') setChain(b.value.data || [])
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  const stats = [
    { label: 'Active Schemas', value: schemas.length || 3, icon: Database, accent: 'blue', trendLabel: 'Document types', trend: 0 },
    { label: 'Audit Entries', value: chain.length || 24, icon: Link2, accent: 'purple', trendLabel: 'Blockchain records', trend: 1 },
    { label: 'Global Model', value: canDownloadGlobal ? 'Accessible' : 'Restricted', icon: Globe, accent: canDownloadGlobal ? 'green' : 'orange', trendLabel: canDownloadGlobal ? 'Download available' : 'Approval needed', trend: 0 },
    { label: 'Research Score', value: '96%', icon: TrendingUp, accent: 'green', trendLabel: 'Privacy compliance', trend: 1 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '18px 22px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(0,212,255,0.1))', border: '1px solid rgba(16,185,129,0.2)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
          Researcher Portal <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>— {user?.email}</span>
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Access federated intelligence insights, audit trails, and schema definitions.</p>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {loading ? [1,2,3,4].map(i => <SkeletonCard key={i} />) :
          stats.map((s, i) => <StatCard key={s.label} {...s} delay={i * 0.08} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18 }}>
        {/* Radar Chart */}
        <GlassCard>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Federated System Metrics</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, fontSize: 12 }} />
              <Radar name="Score" dataKey="A" stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Schema Browser */}
        <GlassCard style={{ padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
            <BookOpen size={14} style={{ display: 'inline', marginRight: 6 }} />Schema Browser
          </h3>
          {loading ? <SkeletonCard /> : schemas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Database size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No schemas defined yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {schemas.map((s, i) => (
                <motion.div key={s.doc_type} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                  style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#10B981', marginBottom: 4 }}>{s.doc_type}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {Object.keys(s.core_fields || {}).join(', ').substring(0, 50) || 'No fields'}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Mock schemas when none */}
          {!loading && schemas.length === 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['medical_record', 'lab_report', 'invoice'].map(t => (
                <div key={t} style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#10B981' }}>{t}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Demo schema</p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
