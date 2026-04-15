import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link2, Search, Filter, ChevronDown, ChevronRight, Shield } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import { Loader, SkeletonCard } from '../../components/ui/Loader'
import { blockchainApi } from '../../api/blockchain'

const ACTION_COLORS = {
  DOCUMENT_PROCESSED: '#00D4FF',
  LOCAL_TRAINING_DONE: '#8B5CF6',
  LOCAL_MODEL_DOWNLOADED: '#10B981',
  GLOBAL_MODEL_DOWNLOADED: '#F59E0B',
  SYSTEM_EVENT: '#64748B',
}

const MOCK_CHAIN = [
  { index: 0, hash: '0000000000genesis', previous_hash: '0', timestamp: '2026-04-10T08:00:00', action: 'GENESIS', org_id: 0 },
  { index: 1, hash: 'a1b2c3d4e5f67890abcdef1234567890', previous_hash: '0000000000genesis', timestamp: '2026-04-11T09:15:22', action: 'DOCUMENT_PROCESSED', org_id: 1 },
  { index: 2, hash: 'b2c3d4e5f678901abcdef23456789012', previous_hash: 'a1b2c3d4e5f67890abcdef1234567890', timestamp: '2026-04-11T10:30:45', action: 'DOCUMENT_PROCESSED', org_id: 2 },
  { index: 3, hash: 'c3d4e5f6789012abcdef3456789012ab', previous_hash: 'b2c3d4e5f678901abcdef23456789012', timestamp: '2026-04-12T14:22:10', action: 'LOCAL_TRAINING_DONE', org_id: 1 },
  { index: 4, hash: 'd4e5f67890123abcdef456789012abcd', previous_hash: 'c3d4e5f6789012abcdef3456789012ab', timestamp: '2026-04-12T15:45:33', action: 'LOCAL_MODEL_DOWNLOADED', org_id: 1 },
  { index: 5, hash: 'e5f678901234abcdef56789012abcdef', previous_hash: 'd4e5f67890123abcdef456789012abcd', timestamp: '2026-04-13T09:00:00', action: 'DOCUMENT_PROCESSED', org_id: 3 },
  { index: 6, hash: 'f67890123456abcdef6789012abcdef01', previous_hash: 'e5f678901234abcdef56789012abcdef', timestamp: '2026-04-13T11:20:15', action: 'LOCAL_TRAINING_DONE', org_id: 2 },
  { index: 7, hash: 'g78901234567abcdef789012abcdef012', previous_hash: 'f67890123456abcdef6789012abcdef01', timestamp: '2026-04-14T08:30:00', action: 'GLOBAL_MODEL_DOWNLOADED', org_id: 2 },
]

const BlockCard = ({ block, isLast }) => {
  const [expanded, setExpanded] = useState(false)
  const color = ACTION_COLORS[block.action] || ACTION_COLORS.SYSTEM_EVENT
  const isGenesis = block.index === 0
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* Chain connector */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
        <motion.div whileHover={{ scale: 1.2 }} style={{ width: 14, height: 14, borderRadius: '50%', background: isGenesis ? '#F59E0B' : color, boxShadow: `0 0 10px ${isGenesis ? '#F59E0B' : color}88`, flexShrink: 0, cursor: 'pointer' }} />
        {!isLast && <div style={{ width: 2, flex: 1, background: `linear-gradient(180deg, ${color}60, ${color}20)`, minHeight: 24, marginTop: 4 }} />}
      </div>

      {/* Block Card */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ flex: 1, marginBottom: isLast ? 0 : 14 }}>
        <div
          onClick={() => setExpanded(e => !e)}
          className="glass-card glass-card-hover"
          style={{ padding: '14px 18px', cursor: 'pointer', borderColor: expanded ? `${color}44` : 'var(--glass-border)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color, background: `${color}18`, border: `1px solid ${color}33`, padding: '2px 8px', borderRadius: 6, fontFamily: 'JetBrains Mono, monospace' }}>
                #{block.index}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: block.action === 'GENESIS' ? '#F59E0B' : 'var(--text-primary)' }}>
                {block.action || 'SYSTEM_EVENT'}
              </span>
              {block.org_id > 0 && <span className="badge badge-blue" style={{ fontSize: 10 }}>Org {block.org_id}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {block.timestamp ? new Date(block.timestamp).toLocaleString() : '—'}
              </span>
              {expanded ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
            </div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 700 }}>Block Hash</p>
                    <p className="mono" style={{ fontSize: 11, color, wordBreak: 'break-all' }}>{block.hash || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 700 }}>Previous Hash</p>
                    <p className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{block.previous_hash ? (block.previous_hash.substring(0, 32) + '...') : 'N/A'}</p>
                  </div>
                  {block.details && (
                    <div style={{ gridColumn: '1/-1' }}>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 700 }}>Details</p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{block.details}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

export default function BlockchainAuditor() {
  const [chain, setChain] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await blockchainApi.getAuditTrail()
        const data = res.data || []
        setChain(data.length > 0 ? data : MOCK_CHAIN)
      } catch {
        setChain(MOCK_CHAIN)
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const actions = ['ALL', ...Object.keys(ACTION_COLORS)]
  const filtered = chain.filter(b => {
    const matchSearch = search === '' || b.action?.includes(search.toUpperCase()) || String(b.org_id).includes(search) || b.hash?.includes(search)
    const matchAction = actionFilter === 'ALL' || b.action === actionFilter
    return matchSearch && matchAction
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <GlassCard style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Link2 size={16} color="#8B5CF6" />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Blockchain Audit Trail</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{filtered.length} of {chain.length} blocks shown</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search blocks..." className="input-field" style={{ paddingLeft: 30, width: 190, padding: '7px 10px 7px 30px', fontSize: 12 }} />
            </div>
          </div>
        </div>

        {/* Action Filter */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          {actions.map(a => (
            <button key={a} onClick={() => setActionFilter(a)} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${actionFilter === a ? (ACTION_COLORS[a] || '#00D4FF') : 'var(--border-color)'}55`, background: actionFilter === a ? `${ACTION_COLORS[a] || '#00D4FF'}18` : 'var(--bg-card)', color: actionFilter === a ? (ACTION_COLORS[a] || '#00D4FF') : 'var(--text-muted)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
              {a}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Chain */}
      <GlassCard style={{ padding: '22px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Shield size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} color="var(--text-muted)" />
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No blocks match your filter</p>
          </div>
        ) : (
          <div>
            {filtered.map((block, i) => (
              <BlockCard key={block.hash || i} block={block} isLast={i === filtered.length - 1} />
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
