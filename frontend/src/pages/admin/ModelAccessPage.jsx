import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, GlobeLock, RefreshCw, ShieldCheck, ShieldOff } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import { Loader, SkeletonCard } from '../../components/ui/Loader'
import { adminApi } from '../../api/admin'
import toast from 'react-hot-toast'

export default function ModelAccessPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.getAllUsers()
      setUsers(res.data || [])
    } catch {
      setUsers([])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const toggle = async (user) => {
    setActionId(user.id)
    try {
      if (user.can_download_global) {
        await adminApi.revokeGlobal(user.id)
        toast.success(`Global access revoked for ${user.email}`)
      } else {
        await adminApi.grantGlobal(user.id)
        toast.success(`Global access granted to ${user.email}`)
      }
      setUsers(us => us.map(u => u.id === user.id ? { ...u, can_download_global: !u.can_download_global } : u))
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Action failed')
    } finally { setActionId(null) }
  }

  const filtered = users.filter(u =>
    filter === 'all' ? true :
    filter === 'granted' ? u.can_download_global :
    filter === 'pending' ? u.global_request_status === 'PENDING' :
    !u.can_download_global
  )

  const granted = users.filter(u => u.can_download_global).length
  const pendingRequests = users.filter(u => u.global_request_status === 'PENDING').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Users', value: users.length, color: '#00D4FF' },
          { label: 'Access Granted', value: granted, color: '#10B981' },
          { label: 'Pending Requests', value: pendingRequests, color: '#F59E0B' },
          { label: 'Restricted', value: users.length - granted - pendingRequests, color: '#EF4444' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={20} color={s.color} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter + Table */}
      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Global Model Access Control</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {['all', 'granted', 'pending', 'restricted'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${filter === f ? '#00D4FF44' : 'var(--border-color)'}`, background: filter === f ? 'rgba(0,212,255,0.1)' : 'var(--bg-card)', color: filter === f ? '#00D4FF' : 'var(--text-muted)', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                {f}
              </button>
            ))}
            <button onClick={load} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {loading ? <SkeletonCard /> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th><th>Role</th><th>Org ID</th><th>Status</th><th>Global Access</th><th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((u) => (
                    <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} layout>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: u.role === 'ORG' ? 'rgba(0,212,255,0.15)' : 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: u.role === 'ORG' ? '#00D4FF' : '#10B981' }}>
                            {u.email[0].toUpperCase()}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{u.email}</span>
                        </div>
                      </td>
                      <td><span className={`badge badge-${u.role === 'ORG' ? 'blue' : 'green'}`}>{u.role}</span></td>
                      <td className="mono" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.org_id ?? '—'}</td>
                      <td><span className={`badge badge-${u.is_approved ? 'green' : 'orange'}`}>{u.is_approved ? 'Approved' : 'Pending'}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 36, height: 20, borderRadius: 10, background: u.can_download_global ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.2)', position: 'relative', transition: 'background 0.3s', cursor: 'pointer' }} onClick={() => toggle(u)}>
                            <motion.div animate={{ x: u.can_download_global ? 16 : 2 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} style={{ width: 16, height: 16, borderRadius: '50%', background: u.can_download_global ? '#10B981' : '#64748B', position: 'absolute', top: 2, boxShadow: `0 0 6px ${u.can_download_global ? '#10B981' : '#64748B'}` }} />
                          </div>
                          {u.can_download_global ? <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>Granted</span> : u.global_request_status === 'PENDING' ? <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>Req Pending...</span> : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Restricted</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => toggle(u)} disabled={actionId === u.id || !u.is_approved} className={`btn btn-sm ${u.can_download_global ? 'btn-danger' : 'btn-success'}`}>
                            {actionId === u.id ? <Loader size="sm" /> : u.can_download_global ? <><ShieldOff size={12} /> Revoke</> : <><ShieldCheck size={12} /> Grant</>}
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
