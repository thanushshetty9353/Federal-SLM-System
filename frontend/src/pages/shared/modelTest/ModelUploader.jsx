import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, Cpu } from 'lucide-react'
import { modelTestApi } from '../../../api/modelTest'
import toast from 'react-hot-toast'

const FORMAT_COLORS = {
  pkl:    { bg: 'rgba(0,212,255,0.12)',   border: 'rgba(0,212,255,0.3)',   color: '#00D4FF' },
  joblib: { bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.3)',  color: '#8B5CF6' },
  pt:     { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  color: '#F59E0B' },
  pth:    { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  color: '#F59E0B' },
  onnx:   { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)', color: '#10B981' },
}

const fmtBytes = (b) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`

export default function ModelUploader({ onModelUploaded }) {
  const [file, setFile]           = useState(null)
  const [modelName, setModelName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)

  const onDrop = useCallback((accepted) => {
    if (!accepted.length) return
    const f   = accepted[0]
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['pkl','joblib','pt','pth','onnx'].includes(ext)) {
      toast.error('Unsupported format. Use .pkl .joblib .pt .pth .onnx')
      return
    }
    setFile(f)
    setModelName(f.name.replace(/\.[^.]+$/, ''))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: false,
    accept: { 'application/octet-stream': ['.pkl','.joblib','.pt','.pth','.onnx'] },
  })

  const handleUpload = async () => {
    if (!file) return toast.error('Select a model file first')
    if (!modelName.trim()) return toast.error('Enter a model name')
    setUploading(true); setProgress(0)
    const iv = setInterval(() => setProgress(p => Math.min(p + 12, 85)), 200)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('name', modelName.trim())
      const res = await modelTestApi.uploadModel(fd)
      clearInterval(iv); setProgress(100)
      toast.success(`Model "${modelName}" uploaded!`)
      setTimeout(() => { onModelUploaded(res.data); setFile(null); setModelName(''); setProgress(0) }, 600)
    } catch (e) {
      clearInterval(iv); setProgress(0)
      toast.error(e.response?.data?.detail || 'Upload failed')
    } finally { setUploading(false) }
  }

  const ext   = file?.name?.split('.').pop()?.toLowerCase()
  const fStyle = FORMAT_COLORS[ext] || FORMAT_COLORS.pkl

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Drop Zone */}
      <div {...getRootProps()} style={{
        border: `2px dashed ${isDragActive ? 'var(--neon-blue)' : 'var(--border-color)'}`,
        borderRadius:16, padding:'36px 24px', textAlign:'center', cursor:'pointer',
        background: isDragActive ? 'rgba(0,212,255,0.04)' : 'var(--bg-card)',
        transition:'all 0.25s ease', position:'relative', overflow:'hidden',
      }}>
        <input {...getInputProps()} />
        <motion.div animate={{ y: isDragActive ? -4 : 0 }} transition={{ duration:0.2 }}>
          <div style={{
            width:64, height:64, borderRadius:16, margin:'0 auto 16px',
            background:'linear-gradient(135deg,rgba(0,212,255,0.15),rgba(139,92,246,0.15))',
            border:'1px solid rgba(0,212,255,0.2)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Upload size={26} color="var(--neon-blue)" />
          </div>
          <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', marginBottom:6 }}>
            {isDragActive ? 'Drop your model here' : 'Drag & drop your model file'}
          </p>
          <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:14 }}>or click to browse</p>
          <div style={{ display:'flex', justifyContent:'center', gap:8, flexWrap:'wrap' }}>
            {['pkl','joblib','pt','pth','onnx'].map(f => {
              const s = FORMAT_COLORS[f]
              return (
                <span key={f} style={{
                  padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                  background:s.bg, border:`1px solid ${s.border}`, color:s.color,
                  fontFamily:'JetBrains Mono,monospace'
                }}>.{f}</span>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Selected file */}
      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ padding:'14px 16px', borderRadius:12, background:fStyle.bg,
              border:`1px solid ${fStyle.border}`, display:'flex', alignItems:'center', gap:12 }}
          >
            <div style={{
              width:36, height:36, borderRadius:10, background:fStyle.bg,
              border:`1px solid ${fStyle.border}`, display:'flex', alignItems:'center',
              justifyContent:'center', flexShrink:0,
            }}>
              <File size={16} color={fStyle.color} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file.name}</p>
              <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                {fmtBytes(file.size)} · <span style={{ color:fStyle.color, fontWeight:700 }}>.{ext}</span>
              </p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setFile(null); setModelName('') }}
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name input */}
      <AnimatePresence>
        {file && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:8 }}>
              Model Name
            </label>
            <input className="input-field" placeholder="e.g. Cancer Classifier v2"
              value={modelName} onChange={e => setModelName(e.target.value)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <AnimatePresence>
        {uploading && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <div className="progress-bar">
              <motion.div className="progress-fill" animate={{ width:`${progress}%` }} transition={{ duration:0.3 }} />
            </div>
            <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:6, textAlign:'center' }}>Uploading… {progress}%</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload button */}
      <AnimatePresence>
        {file && !uploading && (
          <motion.button
            initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
            className="btn btn-primary" onClick={handleUpload}
            style={{ width:'100%', gap:8, fontSize:14 }}>
            <Cpu size={15} /> Upload Model
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
