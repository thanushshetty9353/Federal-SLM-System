import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Trash2, CheckCircle, Plus } from 'lucide-react'

const FORMAT_COLOR = {
  pkl:    '#00D4FF', joblib: '#8B5CF6', pt: '#F59E0B', pth: '#F59E0B', onnx: '#10B981',
}

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}

export default function ModelSwitcher({ models, activeModel, onSelect, onDelete, onUploadAnother }) {
  if (models.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-muted)', fontSize:13 }}>
        <Cpu size={28} style={{ margin:'0 auto 10px', display:'block', opacity:0.3 }} />
        No models uploaded yet. Upload one above.
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <AnimatePresence initial={false}>
        {models.map((m, i) => {
          const isActive = activeModel?.id === m.id
          const color    = FORMAT_COLOR[m.format] || '#8892A4'
          return (
            <motion.div
              key={m.id}
              initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:12, height:0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onSelect(m)}
              style={{
                padding:'12px 14px', borderRadius:12, cursor:'pointer',
                background: isActive ? `${color}10` : 'var(--bg-card)',
                border: isActive ? `1px solid ${color}45` : '1px solid var(--border-color)',
                boxShadow: isActive ? `0 0 16px ${color}18` : 'none',
                transition:'all 0.2s ease', display:'flex', alignItems:'center', gap:12,
              }}
            >
              {/* Icon */}
              <div style={{
                width:38, height:38, borderRadius:10, flexShrink:0,
                background:`${color}18`, border:`1px solid ${color}30`,
                display:'flex', alignItems:'center', justifyContent:'center', position:'relative',
              }}>
                <Cpu size={16} color={color} />
                {/* Active pulse dot */}
                {isActive && (
                  <motion.div
                    animate={{ scale:[1,1.5,1], opacity:[1,0.5,1] }}
                    transition={{ duration:1.5, repeat:Infinity }}
                    style={{
                      position:'absolute', top:-3, right:-3,
                      width:9, height:9, borderRadius:'50%',
                      background: color, boxShadow:`0 0 8px ${color}`,
                    }}
                  />
                )}
              </div>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{
                    fontSize:13, fontWeight:700,
                    color: isActive ? color : 'var(--text-primary)',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  }}>{m.name}</span>
                  {isActive && (
                    <span style={{
                      fontSize:9, fontWeight:700, padding:'1px 7px', borderRadius:20,
                      background:`${color}20`, border:`1px solid ${color}40`, color,
                      textTransform:'uppercase', letterSpacing:'0.06em', flexShrink:0,
                    }}>ACTIVE</span>
                  )}
                </div>
                <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                  <span style={{ color, fontWeight:700, fontFamily:'JetBrains Mono,monospace' }}>.{m.format}</span>
                  {' · '}{fmtDate(m.created_at)}
                </p>
              </div>

              {/* Delete */}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(m.id) }}
                style={{
                  width:30, height:30, borderRadius:8, flexShrink:0,
                  background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', color:'#EF4444', transition:'all 0.15s',
                }}
              >
                <Trash2 size={12} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Upload Another */}
      <motion.button
        whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
        onClick={onUploadAnother}
        className="btn btn-secondary"
        style={{ width:'100%', gap:8, marginTop:4, fontSize:13 }}
      >
        <Plus size={14} /> Upload Another Model
      </motion.button>
    </div>
  )
}
