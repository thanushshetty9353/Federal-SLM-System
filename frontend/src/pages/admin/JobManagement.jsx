import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Download, Briefcase, RefreshCw } from 'lucide-react'
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

export default function JobManagement() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [creating, setCreating] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getJobs()
      setJobs(res.data || [])
    } catch (e) {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await adminApi.createJob(form)
      toast.success('Training job created')
      setForm({ title: '', description: '' })
      setShowModal(false)
      load()
    } catch (e) {
      toast.error('Failed to create job')
    } finally {
      setCreating(false)
    }
  }

  const handleDownload = async (jobId) => {
    setDownloadingId(jobId)
    try {
      const res = await adminApi.adminDownloadGlobal(jobId)
      triggerDownload(res.data, `global_model_job_${jobId}.pth`)
      toast.success('Global model downloaded successfully')
    } catch (e) {
      toast.error('No global model available for this job yet')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Training Jobs</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Create tasks and manage global models per job.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} className="btn" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', width: 38, height: 38, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ gap: 8 }}>
            <Plus size={16} /> Create Job
          </button>
        </div>
      </div>

      {loading ? <SkeletonCard /> : jobs.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(0,212,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Briefcase size={24} color="#00D4FF" />
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>No training jobs available. Create one to get started.</p>
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {jobs.map((job) => (
            <GlassCard key={job.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
              <div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{job.title}</h3>
                  <span className={`badge badge-${job.status === 'ACTIVE' ? 'green' : 'gray'}`}>{job.status}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{job.description || 'No description provided'}</p>
              </div>
              <div>
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  disabled={downloadingId === job.id}
                  onClick={() => handleDownload(job.id)}
                  className="btn" 
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#8B5CF6', fontSize: 12, gap: 6, padding: '8px 14px' }}>
                  {downloadingId === job.id ? <Loader size="sm" /> : <><Download size={14} /> Download Global Model</>}
                </motion.button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ width: '100%', maxWidth: 400, padding: 30, background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Create Training Job</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Job Title</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="e.g. Invoices Q3 Model" style={{ padding: '10px 14px' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Description (Optional)</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="Describe the focus of this training job..." rows={3} style={{ padding: '10px 14px', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ background: 'transparent', color: 'var(--text-muted)' }}>Cancel</button>
                <button type="submit" disabled={creating} className="btn btn-primary">{creating ? <Loader size="sm" /> : 'Create Job'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
