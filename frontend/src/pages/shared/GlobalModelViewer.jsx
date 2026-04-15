import { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Lock, Download, ShieldCheck, Info, CheckCircle } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import { Loader } from '../../components/ui/Loader'
import { useAuth } from '../../context/AuthContext'
import { orgApi } from '../../api/org'
import toast from 'react-hot-toast'

const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  window.URL.revokeObjectURL(url)
}

const MODEL_FEATURES = [
  'Federated multi-org training (FedAvg)',
  'Differential privacy guarantees',
  'Blockchain-logged model updates',
  'No raw data sharing across orgs',
  'PyTorch compatible (.pth format)',
  'Incremental global aggregation',
]

export default function GlobalModelViewer() {
  const { canDownloadGlobal, isAdmin, user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const res = await orgApi.downloadGlobalModel()
      triggerDownload(res.data, 'global_federated_model.pth')
      toast.success('Global model downloaded successfully!')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Download failed. Model may not be trained yet.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760, margin: '0 auto' }}>
      {/* Hero Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ padding: '32px 28px', borderRadius: 20, background: canDownloadGlobal ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(0,212,255,0.1))' : 'linear-gradient(135deg, rgba(100,116,139,0.1), rgba(71,85,105,0.08))', border: `1px solid ${canDownloadGlobal ? 'rgba(139,92,246,0.3)' : 'rgba(100,116,139,0.2)'}`, textAlign: 'center' }}>
          <motion.div
            animate={canDownloadGlobal ? { rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 4 }}
            style={{ width: 80, height: 80, borderRadius: 22, background: canDownloadGlobal ? 'linear-gradient(135deg, #8B5CF6, #00D4FF)' : 'rgba(100,116,139,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: canDownloadGlobal ? '0 0 40px rgba(139,92,246,0.4)' : 'none' }}
          >
            {canDownloadGlobal ? <Globe size={36} color="#fff" /> : <Lock size={36} color="#64748B" />}
          </motion.div>

          <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
            {canDownloadGlobal ? 'Global Federated Model' : 'Access Restricted'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.7 }}>
            {canDownloadGlobal
              ? 'The aggregated global model trained across all federated organizations. Your download is logged to the blockchain for audit transparency.'
              : 'You do not have permission to download the global federated model. Contact your administrator to request access.'}
          </p>

          {canDownloadGlobal ? (
            <motion.button id="global-model-download-btn" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleDownload} disabled={loading} className="btn btn-primary btn-lg" style={{ gap: 10, fontSize: 15 }}>
              {loading ? <Loader size="sm" /> : <><Download size={18} /> Download Global Model (.pth)</>}
            </motion.button>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <Lock size={16} color="#EF4444" />
              <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 700 }}>Awaiting Admin Approval</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Model Metadata */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12 }}>
        {[
          { label: 'Method', value: 'FedAvg', color: '#8B5CF6' },
          { label: 'Format', value: 'PyTorch .pth', color: '#00D4FF' },
          { label: 'Privacy', value: 'Differential', color: '#10B981' },
          { label: 'Audit', value: 'Blockchain', color: '#F59E0B' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="glass-card" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>{m.label}</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: m.color }}>{m.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Features */}
      <GlassCard>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
          <ShieldCheck size={16} style={{ display: 'inline', marginRight: 8 }} color="#10B981" />
          Federated Model Features
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {MODEL_FEATURES.map((f, i) => (
            <motion.div key={f} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <CheckCircle size={14} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f}</span>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Access Status */}
      <GlassCard style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Info size={16} color="var(--text-muted)" />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
              Access Status: <span style={{ color: canDownloadGlobal ? '#10B981' : '#EF4444' }}>{canDownloadGlobal ? 'Authorized' : 'Not Authorized'}</span>
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Role: {user?.role} • {canDownloadGlobal ? 'Full access granted by administrator' : 'Request access from your administrator'}
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
