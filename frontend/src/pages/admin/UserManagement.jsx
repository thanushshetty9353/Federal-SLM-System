import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Globe, GlobeLock, RefreshCw, Search } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import { Loader, SkeletonCard } from '../../components/ui/Loader'
import { adminApi } from '../../api/admin'
import toast from 'react-hot-toast'

export default function UserManagement() {
  const [pending, setPending] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('pending')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.getPendingUsers()
      setPending(res.data || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const act = async (fn, id, msg) => {
    setActionId(id)
    try {
      await fn(id)
      toast.success(msg)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Action failed')
    } finally { setActionId(null) }
  }

  const filtered = pending.filter(u => u.email?.toLowerCase().includes(search.toLowerCase()))

  const TabBtn = ({ id, label, count }) => (
    <button onClick={() => setTab(id)} style={{ padding: '8px 18px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', border: `1px solid ${tab === id ? 'rgba(0,212,255,0.4)' : 'var(--border-color)'}`, background: tab === id ? 'rgba(0,212,255,0.1)' : 'var(--bg-card)', color: tab === id ? '#00D4FF' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
      {label} {count !== undefined && <span style={{ marginLeft: 6, background: tab === id ? 'rgba(0,212,255,0.2)' : 'var(--bg-secondary)', padding: '1px 7px', borderRadius: 20, fontSize: 11 }}>{count}</span>}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <GlassCard style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <TabBtn id="pending" label="Pending" count={pending.length} />
            <TabBtn id="manage" label="Manage Access" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="input-field" style={{ paddingLeft: 34, width: 200, padding: '8px 12px 8px 34px' }} />
            </div>
            <button onClick={load} style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Pending Tab */}
      {tab === 'pending' && (
        <GlassCard>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
            Pending User Approvals
          </h3>
          {loading ? <SkeletonCard /> : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <CheckCircle size={40} color="#10B981" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14 }}>No pending approvals</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Email</th><th>Role</th><th>Org ID</th><th>Registered</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((u) => (
                      <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.email}</td>
                        <td><span className={`badge badge-${u.role === 'ORG' ? 'blue' : 'green'}`}>{u.role}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{u.org_id ?? '—'}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                              onClick={() => act(adminApi.approveUser, u.id, `${u.email} approved`)}
                              disabled={actionId === u.id}
                              className="btn btn-success btn-sm"
                            >
                              {actionId === u.id ? <Loader size="sm" /> : <><CheckCircle size={13} /> Approve</>}
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                              onClick={() => act(adminApi.rejectUser, u.id, `${u.email} rejected`)}
                              disabled={actionId === u.id}
                              className="btn btn-danger btn-sm"
                            >
                              <XCircle size={13} /> Reject
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
      )}

      {/* Manage Access Tab */}
      {tab === 'manage' && (
        <GlassCard>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Global Model Access Control</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Grant or revoke access to the federated global model for approved users.</p>
          {loading ? <SkeletonCard /> : (
            <div style={{ padding: '24px', borderRadius: 12, background: 'rgba(0,212,255,0.05)', border: '1px dashed rgba(0,212,255,0.2)', textAlign: 'center' }}>
              <Globe size={40} color="#00D4FF" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Use the <strong style={{ color: '#00D4FF' }}>Model Access</strong> page to manage global model permissions per user.</p>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  )
}
