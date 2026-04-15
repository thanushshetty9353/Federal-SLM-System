import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, CheckCircle, Plus, RefreshCw, Loader as LoaderIcon } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import { Loader, SkeletonCard } from '../../components/ui/Loader'
import { orgApi } from '../../api/org'
import toast from 'react-hot-toast'

export default function JobBoard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [joiningId, setJoiningId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await orgApi.getJobs()
      setJobs(res.data || [])
    } catch (e) {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleJoin = async (jobId) => {
    setJoiningId(jobId)
    try {
      await orgApi.joinJob(jobId)
      toast.success('Successfully joined the training job')
      // Update local state
      setJobs(jobs.map(j => j.id === jobId ? { ...j, org_status: 'JOINED' } : j))
    } catch (e) {
      toast.error('Failed to join job')
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Job Board</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>View available training jobs and join them to contribute.</p>
        </div>
        <button onClick={load} className="btn" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', width: 38, height: 38, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? <SkeletonCard /> : jobs.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(0,212,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Briefcase size={24} color="#00D4FF" />
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>No training jobs available at the moment.</p>
        </GlassCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {jobs.map((job) => {
            const isJoined = job.org_status !== 'NOT_JOINED'
            const isTrained = job.org_status === 'TRAINED'

            return (
              <GlassCard key={job.id} style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(0,212,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Briefcase size={20} color="#00D4FF" />
                  </div>
                  <span className={`badge badge-${job.status === 'ACTIVE' ? 'green' : 'gray'}`}>{job.status}</span>
                </div>
                
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{job.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1, marginBottom: 20 }}>{job.description || 'No description provided.'}</p>
                
                <div style={{ marginTop: 'auto' }}>
                  {isTrained ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 13, fontWeight: 600 }}>
                      <CheckCircle size={16} /> Data Trained
                    </div>
                  ) : isJoined ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, background: 'rgba(0,212,255,0.1)', color: '#00D4FF', fontSize: 13, fontWeight: 600 }}>
                      <CheckCircle size={16} /> Joined (Awaiting Training)
                    </div>
                  ) : (
                    <motion.button 
                      whileHover={{ scale: 1.02 }} 
                      whileTap={{ scale: 0.98 }}
                      disabled={joiningId === job.id || job.status !== 'ACTIVE'}
                      onClick={() => handleJoin(job.id)}
                      className="btn btn-primary" 
                      style={{ width: '100%', gap: 8 }}>
                      {joiningId === job.id ? <Loader size="sm" /> : <><Plus size={16} /> Join Job</>}
                    </motion.button>
                  )}
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
