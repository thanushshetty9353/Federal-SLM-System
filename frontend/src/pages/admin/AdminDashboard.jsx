import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Database, Link2, Activity, Clock, CheckCircle, XCircle, Shield } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import GlassCard from '../../components/ui/GlassCard'
import { SkeletonCard } from '../../components/ui/Loader'
import { adminApi } from '../../api/admin'
import { blockchainApi } from '../../api/blockchain'



export default function AdminDashboard() {
  const [pending, setPending] = useState([])
  const [chain, setChain] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [pu, bc] = await Promise.allSettled([
          adminApi.getPendingUsers(),
          blockchainApi.getAuditTrail()
        ])
        if (pu.status === 'fulfilled') setPending(pu.value.data || [])
        if (bc.status === 'fulfilled') setChain(bc.value.data || [])
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  const stats = [
    { label: 'Pending Approvals', value: pending.length, icon: Clock, accent: 'orange', trendLabel: 'Awaiting review', trend: 0 },
    { label: 'Blockchain Blocks', value: chain.length, icon: Link2, accent: 'purple', trendLabel: 'Audit entries', trend: 1 },
  ]

  const recentBlocks = chain.slice(-5).reverse()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {loading ? [1,2,3,4].map(i => <SkeletonCard key={i} />) :
          stats.map((s, i) => <StatCard key={s.label} {...s} delay={i * 0.08} />)
        }
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>


        {/* Recent Blockchain */}
        <GlassCard>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Recent Audit Trail</h3>
          {loading ? <SkeletonCard /> : recentBlocks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No blockchain entries yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentBlocks.map((block, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#8B5CF6' }}>#{block.index ?? i}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Org {block.org_id ?? '—'}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{block.action || block.data?.action || 'SYSTEM_EVENT'}</p>
                  <p className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {block.hash ? block.hash.substring(0, 28) + '...' : 'genesis'}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Pending Users */}
      {pending.length > 0 && (
        <GlassCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 8px #F59E0B', animation: 'glow-pulse 2s infinite' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Pending Approvals ({pending.length})</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Email</th><th>Role</th><th>Org ID</th><th>Status</th></tr></thead>
              <tbody>
                {pending.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.email}</td>
                    <td><span className={`badge badge-${u.role === 'ORG' ? 'blue' : 'green'}`}>{u.role}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.org_id ?? '—'}</td>
                    <td><span className="badge badge-orange">Pending</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
