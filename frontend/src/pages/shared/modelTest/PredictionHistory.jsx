import { motion, AnimatePresence } from 'framer-motion'
import { History, Trash2, Copy, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const CONF_BADGE = (c) => {
  const pct = Math.round(c * 100)
  if (c >= 0.85) return <span className="badge badge-green"><CheckCircle size={8} /> {pct}%</span>
  if (c >= 0.65) return <span className="badge badge-orange"><AlertTriangle size={8} /> {pct}%</span>
  return <span className="badge badge-red">{pct}%</span>
}

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })

export default function PredictionHistory({ history, onClear }) {
  if (history.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-muted)', fontSize:13 }}>
        <History size={28} style={{ margin:'0 auto 10px', display:'block', opacity:0.3 }} />
        No predictions yet. Run a prediction to see history here.
      </div>
    )
  }

  const copyRow = (row) => {
    const text = `Model: ${row.model_name} | Target: ${row.target_field} | Prediction: ${row.prediction} | Confidence: ${Math.round(row.confidence*100)}%`
    navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard'))
  }

  return (
    <div>
      {/* Table header controls */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <History size={14} color="var(--neon-purple)" />
          <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>
            Prediction History
          </span>
          <span style={{
            fontSize:11, padding:'2px 8px', borderRadius:20,
            background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.3)',
            color:'var(--neon-purple)', fontWeight:700,
          }}>{history.length}</span>
        </div>
        {history.length > 0 && (
          <button onClick={onClear} className="btn btn-danger btn-sm" style={{ gap:5, fontSize:11 }}>
            <Trash2 size={11} /> Clear
          </button>
        )}
      </div>

      {/* Responsive table wrapper */}
      <div style={{ overflowX:'auto' }}>
        <table className="data-table" style={{ minWidth:640 }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Model</th>
              <th>Schema</th>
              <th>Target</th>
              <th>Prediction</th>
              <th>Confidence</th>
              <th>Time</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {history.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity:0, x:-10 }}
                  animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, height:0 }}
                  transition={{ delay: i < 5 ? i * 0.04 : 0 }}
                >
                  <td style={{ color:'var(--text-muted)', fontSize:12, width:36 }}>
                    {history.length - i}
                  </td>
                  <td>
                    <span style={{
                      fontSize:12, fontWeight:600, color:'var(--neon-blue)',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      display:'block', maxWidth:140,
                    }}>{row.model_name}</span>
                  </td>
                  <td>
                    <span style={{ fontSize:11, color:'var(--text-secondary)', fontFamily:'JetBrains Mono,monospace' }}>
                      {row.schema || '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize:11, color:'#EF4444', fontFamily:'JetBrains Mono,monospace' }}>
                      {row.target_field}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize:13, fontWeight:800, color:'var(--text-primary)' }}>
                      {row.prediction}
                    </span>
                  </td>
                  <td>{CONF_BADGE(row.confidence)}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--text-muted)' }}>
                      <Clock size={10} /> {fmtTime(row.timestamp)}
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => copyRow(row)}
                      style={{
                        width:26, height:26, borderRadius:7,
                        background:'var(--bg-card)', border:'1px solid var(--border-color)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        cursor:'pointer', color:'var(--text-muted)',
                      }}
                    >
                      <Copy size={11} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  )
}
