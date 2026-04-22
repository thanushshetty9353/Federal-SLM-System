import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, Globe, Shield, RefreshCw, CheckCircle } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import { Loader, SkeletonCard } from '../../components/ui/Loader'
import { adminApi } from '../../api/admin'
import toast from 'react-hot-toast'

const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  window.URL.revokeObjectURL(url)
}

export default function AdminDownloadsPage() {
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState('')
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [downloading, setDownloading] = useState(false)

  const loadJobs = async () => {
    setLoadingJobs(true)
    try {
      const res = await adminApi.getJobs()
      setJobs(res.data || [])
      if ((res.data || []).length > 0) setSelectedJob(res.data[0].id)
    } catch {
      toast.error('Failed to load jobs')
    } finally {
      setLoadingJobs(false)
    }
  }

  useEffect(() => { loadJobs() }, [])

  const downloadGlobal = async () => {
    if (!selectedJob) return toast.error('Select a job first')
    setDownloading(true)
    try {
      const res = await adminApi.adminDownloadGlobal(selectedJob)
      triggerDownload(res.data, `global_model_job${selectedJob}.pth`)
      toast.success('Global model downloaded!')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Global model not available for this job.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '18px 22px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(0,212,255,0.08))', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Shield size={20} color="#8B5CF6" />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Admin — Global Model Downloads</h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          As an administrator, you have unrestricted access to download the aggregated federated global model for any job.
        </p>
      </motion.div>

      {/* Job Selection */}
      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block' }}>Select Training Job</label>
          <button onClick={loadJobs} style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <RefreshCw size={13} />
          </button>
        </div>
        {loadingJobs ? (
          <div style={{ textAlign: 'center' }}><Loader size="sm" /></div>
        ) : jobs.length === 0 ? (
          <div style={{ fontSize: 13, color: '#EF4444', textAlign: 'center', padding: '12px 0' }}>
            No jobs found. Create a job first.
          </div>
        ) : (
          <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)} className="input-field" style={{ padding: '10px 14px' }}>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title} (ID: {j.id})</option>)}
          </select>
        )}
      </GlassCard>

      {/* Global Model Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <GlassCard hover>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            <div style={{ width: 54, height: 54, borderRadius: 14, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Globe size={24} color="#8B5CF6" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Global Federated Model</h3>
                <span className="badge badge-green"><CheckCircle size={9} /> Admin Access</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                The aggregated model produced by federated averaging across all participating organizations. Only available after model aggregation is complete.
              </p>

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
                {[
                  { label: 'Format', value: '.pth' },
                  { label: 'Method', value: 'FedAvg' },
                  { label: 'Access', value: 'Unrestricted' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(139,92,246,0.06)', textAlign: 'center' }}>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{s.label}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#8B5CF6' }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <motion.button
                id="admin-download-global-btn"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={downloadGlobal}
                disabled={downloading || !selectedJob || jobs.length === 0}
                className="btn btn-primary"
                style={{ gap: 8, width: '100%' }}
              >
                {downloading ? <Loader size="sm" /> : <><Download size={15} /> Download Global Model</>}
              </motion.button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Note */}
      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Shield size={14} color="#8B5CF6" style={{ marginTop: 1, flexShrink: 0 }} />
        <span>Admin downloads are logged in the blockchain audit trail. This action is fully traceable.</span>
      </div>
    </div>
  )
}
