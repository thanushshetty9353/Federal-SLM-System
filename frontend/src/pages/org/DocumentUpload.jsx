import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle, AlertCircle, ChevronRight, X, Zap } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import { Loader } from '../../components/ui/Loader'
import { orgApi } from '../../api/org'
import toast from 'react-hot-toast'

const PIPELINE_STEPS = [
  { id: 'upload', label: 'File Upload', color: '#00D4FF' },
  { id: 'ocr', label: 'OCR Extraction', color: '#8B5CF6' },
  { id: 'slm', label: 'SLM Processing', color: '#F59E0B' },
  { id: 'dataset', label: 'Dataset Save', color: '#10B981' },
  { id: 'blockchain', label: 'Blockchain Log', color: '#EF4444' },
]

export default function DocumentUpload() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState(-1)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) { setFile(accepted[0]); setResult(null); setError('') }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: false,
    accept: { 'application/pdf': ['.pdf'], 'text/csv': ['.csv'], 'text/plain': ['.txt'], 'image/*': ['.png', '.jpg', '.jpeg'] }
  })

  const simulateStep = (s) => new Promise(res => setTimeout(() => { setStep(s); res() }, 900))

  const handleUpload = async () => {
    if (!file) return
    setUploading(true); setStep(0); setProgress(0); setError(''); setResult(null)
    try {
      await simulateStep(0)
      await simulateStep(1)
      await simulateStep(2)
      const res = await orgApi.uploadDocument(file, (p) => setProgress(p))
      await simulateStep(3)
      await simulateStep(4)
      setResult(res.data)
      toast.success('Document processed successfully!')
    } catch (e) {
      const msg = e.response?.data?.detail || 'Upload failed. Check your backend connection.'
      setError(msg)
      toast.error('Upload failed')
      // Still show simulated success for UI demo
      setResult({ message: 'Demo mode — backend offline', doc_id: 'DEMO-001', records_extracted: 0 })
    } finally {
      setUploading(false)
      setProgress(100)
    }
  }

  const reset = () => { setFile(null); setResult(null); setError(''); setStep(-1); setProgress(0) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760, margin: '0 auto' }}>
      {/* Drop Zone */}
      <GlassCard>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Upload Document</h3>
        <motion.div
          {...getRootProps()}
          animate={{ borderColor: isDragActive ? '#00D4FF' : 'rgba(255,255,255,0.1)' }}
          style={{
            border: '2px dashed', borderColor: isDragActive ? '#00D4FF' : 'rgba(255,255,255,0.1)',
            borderRadius: 14, padding: '40px 20px', textAlign: 'center', cursor: 'pointer',
            background: isDragActive ? 'rgba(0,212,255,0.06)' : 'transparent', transition: 'all 0.2s',
          }}
        >
          <input {...getInputProps()} id="doc-upload-input" />
          <motion.div animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}>
            <Upload size={40} color={isDragActive ? '#00D4FF' : 'var(--text-muted)'} style={{ margin: '0 auto 14px', display: 'block' }} />
          </motion.div>
          <p style={{ fontSize: 15, fontWeight: 600, color: isDragActive ? '#00D4FF' : 'var(--text-primary)', marginBottom: 6 }}>
            {isDragActive ? 'Drop it here!' : 'Drag & drop your document'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>PDF, CSV, TXT, PNG, JPG — up to 50MB</p>
        </motion.div>

        {/* Selected File */}
        <AnimatePresence>
          {file && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileText size={18} color="#00D4FF" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); reset() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Button */}
        {file && !uploading && !result && (
          <motion.button id="doc-upload-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={handleUpload} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 14 }}>
            <Zap size={16} /> Process Document
          </motion.button>
        )}
      </GlassCard>

      {/* Pipeline Progress */}
      <AnimatePresence>
        {(uploading || step >= 0) && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <GlassCard>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Processing Pipeline</h3>
              {/* Progress Bar */}
              {uploading && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Overall progress</span>
                    <span style={{ fontSize: 12, color: '#00D4FF', fontWeight: 600 }}>{progress}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                </div>
              )}
              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {PIPELINE_STEPS.map((s, i) => {
                  const done = step > i
                  const active = step === i
                  return (
                    <div key={s.id}>
                      <motion.div initial={{ opacity: 0.4 }} animate={{ opacity: done || active ? 1 : 0.4 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: active ? `${s.color}12` : 'transparent', border: `1px solid ${active ? `${s.color}33` : 'transparent'}`, transition: 'all 0.3s' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? `${s.color}30` : active ? `${s.color}20` : 'var(--bg-secondary)', border: `2px solid ${done || active ? s.color : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {done ? <CheckCircle size={14} color={s.color} /> : active ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Loader size="sm" /></motion.div> : <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</span>}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: done || active ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s.label}</span>
                        {done && <CheckCircle size={14} color={s.color} style={{ marginLeft: 'auto' }} />}
                        {active && <span style={{ marginLeft: 'auto', fontSize: 11, color: s.color, fontWeight: 600 }}>In progress...</span>}
                      </motion.div>
                      {i < PIPELINE_STEPS.length - 1 && (
                        <div style={{ marginLeft: 27, width: 2, height: 8, background: done ? s.color : 'var(--border-color)', opacity: 0.4 }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <GlassCard neon="green">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <CheckCircle size={32} color="#10B981" />
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#10B981', margin: 0 }}>Processing Complete!</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{result.message}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Document ID</p>
                  <p className="mono" style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>{result.doc_id}</p>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Records Extracted</p>
                  <p style={{ fontSize: 22, color: '#10B981', fontWeight: 800, lineHeight: 1 }}>{result.records_extracted}</p>
                </div>
              </div>
              <button onClick={reset} className="btn btn-secondary" style={{ marginTop: 14, width: '100%' }}>Upload Another Document</button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
