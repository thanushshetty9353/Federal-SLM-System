import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, Lock, Globe, BookOpen, CheckCircle } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import { Loader } from '../../components/ui/Loader'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'
import toast from 'react-hot-toast'

const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  window.URL.revokeObjectURL(url)
}

export default function ResearcherDownloadsPage() {
  const { user, canDownloadGlobal } = useAuth()
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState('')
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [hasRequested, setHasRequested] = useState(user?.global_request_status === 'PENDING')

  const loadJobs = async () => {
    setLoadingJobs(true)
    try {
      const res = await axiosInstance.get('/admin/jobs')
      setJobs(res.data || [])
      if ((res.data || []).length > 0) setSelectedJob(res.data[0].id)
    } catch {
      toast.error('Failed to load jobs')
    } finally {
      setLoadingJobs(false)
    }
  }

  useEffect(() => { loadJobs() }, [])

  const requestAccess = async () => {
    try {
      await axiosInstance.post('/researcher/request-global-access')
      toast.success('Access request submitted to administrator')
      setHasRequested(true)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to submit access request')
    }
  }

  const downloadGlobal = async () => {
    if (!selectedJob) return toast.error('Select a job first')
    setDownloading(true)
    try {
      const res = await axiosInstance.get(`/researcher/global-model/${selectedJob}`, { responseType: 'blob' })
      triggerDownload(res.data, `global_model_job${selectedJob}.pth`)
      toast.success('Global model downloaded!')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Access denied or model not available.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '18px 22px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(0,212,255,0.08))', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <BookOpen size={20} color="#10B981" />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Researcher — Model Downloads</h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Download the aggregated global federated model for research purposes. Admin approval is required.
        </p>
      </motion.div>

      {/* Access Status Banner */}
      {canDownloadGlobal ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <CheckCircle size={16} color="#10B981" />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>Global Access Granted</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>You have been authorized to download the global federated model.</p>
          </div>
        </motion.div>
      ) : hasRequested ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>Pending Admin Approval</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Your request is under review. You'll be able to download once approved.</p>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Lock size={16} color="#EF4444" style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#EF4444', marginBottom: 4 }}>Access Restricted</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Submit a request to the administrator to get access to the global federated model.</p>
            <button onClick={requestAccess} className="btn" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', fontSize: 12, padding: '6px 16px', borderRadius: 8 }}>
              Request Access from Admin
            </button>
          </div>
        </motion.div>
      )}

      {/* Job Selection */}
      <GlassCard>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
          Select Training Job
        </label>
        {loadingJobs ? (
          <div style={{ textAlign: 'center' }}><Loader size="sm" /></div>
        ) : jobs.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
            No jobs available.
          </div>
        ) : (
          <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)} className="input-field" style={{ padding: '10px 14px' }}>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title} (ID: {j.id})</option>)}
          </select>
        )}
      </GlassCard>

      {/* Global Model Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <GlassCard hover>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            <div style={{ width: 54, height: 54, borderRadius: 14, background: canDownloadGlobal ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.12)', border: `1px solid ${canDownloadGlobal ? 'rgba(16,185,129,0.35)' : 'rgba(100,116,139,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Globe size={24} color={canDownloadGlobal ? '#10B981' : '#64748B'} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Global Federated Model</h3>
                {canDownloadGlobal
                  ? <span className="badge badge-green"><CheckCircle size={9} /> Permitted</span>
                  : hasRequested
                    ? <span className="badge badge-orange">Pending</span>
                    : <span className="badge badge-gray"><Lock size={9} /> Restricted</span>
                }
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                The aggregated federated model trained across all participating organizations using FedAvg. Requires explicit admin permission.
              </p>

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Format', value: '.pth' },
                  { label: 'Method', value: 'FedAvg' },
                  { label: 'Access', value: canDownloadGlobal ? 'Granted' : 'Locked' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '8px 10px', borderRadius: 8, background: canDownloadGlobal ? 'rgba(16,185,129,0.06)' : 'rgba(100,116,139,0.06)', textAlign: 'center' }}>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{s.label}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: canDownloadGlobal ? '#10B981' : '#64748B' }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <motion.button
                id="researcher-download-global-btn"
                whileHover={canDownloadGlobal ? { scale: 1.01 } : {}}
                whileTap={canDownloadGlobal ? { scale: 0.98 } : {}}
                onClick={canDownloadGlobal ? downloadGlobal : undefined}
                disabled={!canDownloadGlobal || downloading || jobs.length === 0}
                className="btn btn-primary"
                style={{ gap: 8, opacity: canDownloadGlobal ? 1 : 0.45, cursor: canDownloadGlobal ? 'pointer' : 'not-allowed', width: '100%' }}
              >
                {downloading ? <Loader size="sm" /> : canDownloadGlobal
                  ? <><Download size={15} /> Download Global Model</>
                  : <><Lock size={15} /> Access Restricted</>
                }
              </motion.button>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}
