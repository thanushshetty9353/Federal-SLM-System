import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, Lock, Globe, HardDrive, CheckCircle, ShieldCheck } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import { Loader } from '../../components/ui/Loader'
import { useAuth } from '../../context/AuthContext'
import { orgApi } from '../../api/org'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  window.URL.revokeObjectURL(url)
}

export default function DownloadsPage() {
  const { user, canDownloadGlobal } = useAuth()
  const [localLoading, setLocalLoading] = useState(false)
  const [globalLoading, setGlobalLoading] = useState(false)
  
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState('')
  const [loadingJobs, setLoadingJobs] = useState(true)

  // Use user.global_request_status to know if pending
  // We assume there's a way to refresh it (for now rely on full reload)
  // Or just mock the state locally if requested
  const [requestStatus, setRequestStatus] = useState('NONE')
  const [isGranted, setIsGranted] = useState(false)

  const loadJobs = async () => {
    try {
      const res = await orgApi.getJobs()
      const joined = (res.data || []).filter(j => j.org_status !== 'NOT_JOINED')
      setJobs(joined)
      if (joined.length > 0) setSelectedJob(joined[0].id)
    } catch {
      toast.error('Failed to load jobs')
    } finally {
      setLoadingJobs(false)
    }
  }

  // Initialize hasRequested based on user state
  const [hasRequested, setHasRequested] = useState(user?.global_request_status === 'PENDING')

  useEffect(() => { loadJobs() }, [])

  const requestAccess = async () => {
    try {
      await orgApi.requestGlobalAccess()
      toast.success('Access request submitted')
      setHasRequested(true)
    } catch(e) {
      toast.error('Failed to request access')
    }
  }

  const downloadLocal = async () => {
    if (!selectedJob) return
    setLocalLoading(true)
    try {
      const res = await orgApi.downloadLocalModel(selectedJob)
      triggerDownload(res.data, 'local_model.pth')
      toast.success('Local model downloaded!')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Local model not found — train first.')
    } finally { setLocalLoading(false) }
  }

  const downloadGlobal = async () => {
    if (!selectedJob) return
    setGlobalLoading(true)
    try {
      const res = await orgApi.downloadGlobalModel(selectedJob)
      triggerDownload(res.data, 'global_model.pth')
      toast.success('Global model downloaded!')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Access denied or model unavailable.')
    } finally { setGlobalLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700, margin: '0 auto' }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Download trained model weights to deploy locally or for research purposes.</p>

      {/* Job Selection */}
      <GlassCard>
        {loadingJobs ? (
          <div style={{ textAlign: 'center' }}><Loader size="sm" /></div>
        ) : jobs.length === 0 ? (
           <div style={{ fontSize: 13, color: '#EF4444', textAlign: 'center' }}>
             You haven't joined any jobs yet. <Link to="/org/jobs" style={{ color: '#00D4FF' }}>Join a job first.</Link>
           </div>
        ) : (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Select Job to Download Model</label>
            <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)} className="input-field" style={{ padding: '10px 14px' }}>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title} ({j.org_status})</option>)}
            </select>
          </div>
        )}
      </GlassCard>

      {/* Local Model Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <GlassCard hover neon="blue">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            <div style={{ width: 54, height: 54, borderRadius: 14, background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <HardDrive size={24} color="#00D4FF" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Local Model</h3>
                <span className="badge badge-blue">Your Org</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                Your organization's locally trained model weights. Trained using only your private dataset — never shared raw data.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
                {[{ label: 'Format', value: '.pth' }, { label: 'Framework', value: 'PyTorch' }, { label: 'Privacy', value: '✓ Local' }].map(s => (
                  <div key={s.label} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(0,212,255,0.06)', textAlign: 'center' }}>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{s.label}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#00D4FF' }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <motion.button id="download-local-btn" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={downloadLocal} disabled={localLoading} className="btn btn-primary" style={{ gap: 8 }}>
                {localLoading ? <Loader size="sm" /> : <><Download size={15} /> Download Local Model</>}
              </motion.button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Global Model Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <GlassCard hover>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            <div style={{ width: 54, height: 54, borderRadius: 14, background: 'rgba(139,92,246,0.15)', border: `1px solid rgba(139,92,246,0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Globe size={24} color="#8B5CF6" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Global Federated Model</h3>
                {hasRequested ? <span className="badge badge-orange">Pending Admin</span> : <span className="badge badge-gray"><Lock size={9} /> Restricted</span>}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                The aggregated federated model trained across all organizations. Requires explicit admin permission to download.
              </p>

              {!canDownloadGlobal && !hasRequested && (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Lock size={14} color="var(--text-secondary)" />
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>Access Must Be Requested</p>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginBottom: 10 }}>Global models contain aggregated knowledge. To prevent abuse, submit an access request.</p>
                  
                  <button onClick={requestAccess} className="btn" style={{ background: '#8B5CF6', color: '#fff', fontSize: 12, padding: '6px 14px', borderRadius: 6 }}>
                    Request Access from Admin
                  </button>
                </div>
              )}

              {!canDownloadGlobal && hasRequested && (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                    <p style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>Request Pending Approval</p>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>The administrator will review your request shortly. You can download the model once approved.</p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
                {[{ label: 'Format', value: '.pth' }, { label: 'Method', value: 'FedAvg' }, { label: 'Access', value: canDownloadGlobal ? 'Granted' : 'Locked' }].map(s => (
                  <div key={s.label} style={{ padding: '8px 10px', borderRadius: 8, background: canDownloadGlobal ? 'rgba(139,92,246,0.06)' : 'rgba(100,116,139,0.06)', textAlign: 'center' }}>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{s.label}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: canDownloadGlobal ? '#8B5CF6' : '#64748B' }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <motion.button id="download-global-btn" whileHover={canDownloadGlobal ? { scale: 1.01 } : {}} whileTap={canDownloadGlobal ? { scale: 0.98 } : {}}
                onClick={canDownloadGlobal ? downloadGlobal : undefined}
                disabled={!canDownloadGlobal || globalLoading}
                className="btn btn-primary"
                style={{ gap: 8, opacity: canDownloadGlobal ? 1 : 0.5, cursor: canDownloadGlobal ? 'pointer' : 'not-allowed', width: '100%' }}>
                {globalLoading ? <Loader size="sm" /> : canDownloadGlobal ? <><Download size={15} /> Download Global Model</> : <><Lock size={15} /> Access Restricted</>}
              </motion.button>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}
