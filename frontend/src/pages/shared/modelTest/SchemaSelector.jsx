import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, ChevronDown, Target, RefreshCw, Info } from 'lucide-react'
import { schemaApi } from '../../../api/schema'
import { Loader } from '../../../components/ui/Loader'
import toast from 'react-hot-toast'

const TYPE_COLORS = {
  float:  '#00D4FF', int: '#00D4FF', string: '#8B5CF6',
  bool:   '#10B981', date: '#F59E0B', target: '#EF4444',
}

export default function SchemaSelector({ selectedSchema, targetField, onSchemaChange, onTargetChange }) {
  const [schemas, setSchemas]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [open, setOpen]         = useState(false)

  const loadSchemas = async () => {
    setLoading(true)
    try {
      const res = await schemaApi.getAllSchemas()
      setSchemas(res.data || [])
    } catch { toast.error('Failed to load schemas') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadSchemas() }, [])

  // Merge core + dynamic into one flat field map
  const allFields = selectedSchema
    ? { ...(selectedSchema.core_fields || {}), ...(selectedSchema.dynamic_fields || {}) }
    : {}

  // All field names (for target dropdown)
  const fieldNames = Object.keys(allFields)

  // Auto-detect target: field whose type value is "target"
  useEffect(() => {
    if (!selectedSchema) return
    const autoTarget = Object.entries(allFields).find(([, v]) => v === 'target')
    if (autoTarget && !targetField) {
      onTargetChange(autoTarget[0])
    }
  }, [selectedSchema])

  const handleSelectSchema = (s) => {
    onSchemaChange(s)
    onTargetChange('') // reset target when schema changes
    setOpen(false)
    // Re-run auto-detect after state settles
    const autoTarget = Object.entries({
      ...(s.core_fields || {}), ...(s.dynamic_fields || {})
    }).find(([, v]) => v === 'target')
    if (autoTarget) onTargetChange(autoTarget[0])
  }

  // Non-target fields count
  const inputFieldCount = fieldNames.filter(k => k !== targetField).length

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Schema Dropdown */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)' }}>Select Schema</label>
          <button onClick={loadSchemas}
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4, fontSize:11 }}>
            <RefreshCw size={11} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'12px 0' }}><Loader size="sm" /></div>
        ) : schemas.length === 0 ? (
          <div style={{ padding:'14px', borderRadius:10, border:'1px dashed var(--border-color)',
            textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>
            No schemas found. Create one in Schema Builder.
          </div>
        ) : (
          <div style={{ position:'relative' }}>
            <button
              onClick={() => setOpen(o => !o)}
              style={{
                width:'100%', padding:'11px 14px', borderRadius:10,
                background:'var(--bg-card)', border:'1px solid var(--border-color)',
                color: selectedSchema ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize:13, cursor:'pointer', display:'flex', alignItems:'center',
                justifyContent:'space-between', gap:8, fontFamily:'Inter,sans-serif',
                transition:'all 0.2s',
              }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Database size={14} color="var(--neon-blue)" />
                {selectedSchema ? selectedSchema.doc_type : 'Choose a schema…'}
              </div>
              <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration:0.2 }}>
                <ChevronDown size={14} />
              </motion.div>
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity:0, y:-8, scaleY:0.9 }}
                  animate={{ opacity:1, y:0, scaleY:1 }}
                  exit={{ opacity:0, y:-8, scaleY:0.9 }}
                  style={{
                    position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:50,
                    background:'var(--bg-secondary)', border:'1px solid var(--border-color)',
                    borderRadius:12, overflow:'hidden', maxHeight:240, overflowY:'auto',
                    boxShadow:'0 12px 32px rgba(0,0,0,0.4)',
                  }}
                >
                  {schemas.map((s, i) => {
                    const fields = { ...(s.core_fields||{}), ...(s.dynamic_fields||{}) }
                    const total  = Object.keys(fields).length
                    const hasTarget = Object.values(fields).includes('target')
                    return (
                      <motion.div
                        key={s.doc_type}
                        initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.04 }}
                        onClick={() => handleSelectSchema(s)}
                        style={{
                          padding:'12px 14px', cursor:'pointer',
                          borderBottom: i < schemas.length-1 ? '1px solid var(--border-color)' : 'none',
                          background: selectedSchema?.doc_type === s.doc_type ? 'rgba(0,212,255,0.06)' : 'transparent',
                          transition:'background 0.15s',
                        }}
                        whileHover={{ background:'rgba(0,212,255,0.06)' }}
                      >
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <span style={{ fontSize:13, fontWeight:600, color:'var(--neon-blue)' }}>{s.doc_type}</span>
                          <div style={{ display:'flex', gap:6 }}>
                            <span className="badge badge-blue" style={{ fontSize:10 }}>{total} fields</span>
                            {hasTarget && <span className="badge badge-red" style={{ fontSize:10 }}>target ✓</span>}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Schema field preview */}
      <AnimatePresence>
        {selectedSchema && (
          <motion.div
            initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
          >
            {/* Target field selector */}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:8 }}>
                Target Field <span style={{ color:'var(--neon-red)', fontSize:11 }}>(what to predict)</span>
              </label>
              <select
                className="input-field"
                value={targetField}
                onChange={e => onTargetChange(e.target.value)}
                style={{ fontSize:13 }}
              >
                <option value="">— select target field —</option>
                {fieldNames.map(k => (
                  <option key={k} value={k}>
                    {k} ({allFields[k]}){allFields[k] === 'target' ? ' ← auto-detected' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Info bar */}
            <div style={{
              padding:'10px 12px', borderRadius:10,
              background:'rgba(0,212,255,0.05)', border:'1px solid rgba(0,212,255,0.15)',
              display:'flex', alignItems:'center', gap:8, marginBottom:12,
            }}>
              <Info size={13} color="var(--neon-blue)" style={{ flexShrink:0 }} />
              <span style={{ fontSize:11, color:'var(--text-secondary)' }}>
                <strong style={{ color:'var(--neon-blue)' }}>{inputFieldCount}</strong> input fields will be generated ·{' '}
                {targetField
                  ? <><strong style={{ color:'#EF4444' }}>{targetField}</strong> is the prediction output</>
                  : 'Select a target field above'
                }
              </span>
            </div>

            {/* Field chips */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {Object.entries(allFields).map(([k, v]) => {
                const isTarget = k === targetField
                return (
                  <motion.span
                    key={k}
                    initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
                    style={{
                      padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600,
                      background: isTarget ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)',
                      border: isTarget ? '1px solid rgba(239,68,68,0.35)' : '1px solid var(--border-color)',
                      color: isTarget ? '#EF4444' : (TYPE_COLORS[v] || 'var(--text-secondary)'),
                      display:'flex', alignItems:'center', gap:4,
                    }}
                  >
                    {isTarget && <Target size={9} />}
                    {k}
                    <span style={{ opacity:0.6, fontSize:9, fontFamily:'JetBrains Mono,monospace' }}>:{v}</span>
                  </motion.span>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
