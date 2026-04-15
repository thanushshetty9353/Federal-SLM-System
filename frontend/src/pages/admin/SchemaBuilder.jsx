import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Save, Database, ChevronRight, Eye } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import { Loader } from '../../components/ui/Loader'
import { schemaApi } from '../../api/schema'
import toast from 'react-hot-toast'

const FIELD_TYPES = ['string', 'int', 'float', 'bool', 'date']

const emptyField = () => ({ key: '', type: 'string' })

export default function SchemaBuilder() {
  const [docType, setDocType] = useState('')
  const [coreFields, setCoreFields] = useState([emptyField()])
  const [dynamicFields, setDynamicFields] = useState([])
  const [schemas, setSchemas] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(null)

  const loadSchemas = async () => {
    setLoading(true)
    try {
      const res = await schemaApi.getAllSchemas()
      setSchemas(res.data || [])
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { loadSchemas() }, [])

  const addField = (setter) => setter(f => [...f, emptyField()])
  const removeField = (setter, idx) => setter(f => f.filter((_, i) => i !== idx))
  const updateField = (setter, idx, key, val) => setter(f => f.map((item, i) => i === idx ? { ...item, [key]: val } : item))

  const handleSave = async () => {
    if (!docType.trim()) { toast.error('Document type is required'); return }
    const coreObj = {}, dynObj = {}
    coreFields.forEach(f => { if (f.key.trim()) coreObj[f.key.trim()] = f.type })
    dynamicFields.forEach(f => { if (f.key.trim()) dynObj[f.key.trim()] = f.type })
    if (Object.keys(coreObj).length === 0) { toast.error('At least one core field required'); return }

    setSaving(true)
    try {
      await schemaApi.createSchema({ doc_type: docType, core_fields: coreObj, dynamic_fields: dynObj })
      toast.success(`Schema "${docType}" saved!`)
      loadSchemas()
      setDocType(''); setCoreFields([emptyField()]); setDynamicFields([])
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Save failed')
    } finally { setSaving(false) }
  }

  const FieldRow = ({ field, idx, setter, label }) => (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <input placeholder={`${label} field name`} value={field.key} onChange={e => updateField(setter, idx, 'key', e.target.value)} className="input-field" style={{ fontSize: 13, padding: '9px 12px' }} />
      </div>
      <select value={field.type} onChange={e => updateField(setter, idx, 'type', e.target.value)} className="input-field" style={{ width: 110, fontSize: 13, padding: '9px 10px' }}>
        {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <button onClick={() => removeField(setter, idx)} style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EF4444', flexShrink: 0 }}>
        <Trash2 size={13} />
      </button>
    </motion.div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
      {/* Builder */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <GlassCard>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18 }}>Schema Builder</h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Document Type</label>
            <input id="schema-doctype" placeholder="e.g. medical_record, invoice" value={docType} onChange={e => setDocType(e.target.value)} className="input-field" />
          </div>

          {/* Core Fields */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: '#00D4FF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Core Fields</label>
              <button onClick={() => addField(setCoreFields)} className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
                <Plus size={13} /> Add
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {coreFields.map((f, i) => <FieldRow key={i} field={f} idx={i} setter={setCoreFields} label="core" />)}
            </div>
          </div>

          {/* Dynamic Fields */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dynamic Fields <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <button onClick={() => addField(setDynamicFields)} className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
                <Plus size={13} /> Add
              </button>
            </div>
            {dynamicFields.length === 0 ? (
              <div style={{ padding: '14px', borderRadius: 10, border: '1px dashed var(--border-color)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Click Add to define optional dynamic fields</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dynamicFields.map((f, i) => <FieldRow key={i} field={f} idx={i} setter={setDynamicFields} label="dynamic" />)}
              </div>
            )}
          </div>

          <motion.button id="schema-save" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ width: '100%', gap: 8 }}>
            {saving ? <Loader size="sm" /> : <><Save size={15} /> Save Schema</>}
          </motion.button>
        </GlassCard>
      </div>

      {/* Existing Schemas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <GlassCard style={{ padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
            Saved Schemas <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({schemas.length})</span>
          </h3>
          {loading ? <Loader label="Loading..." /> : schemas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              <Database size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
              No schemas yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {schemas.map((s, i) => (
                <motion.div key={s.doc_type} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                  style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', cursor: 'pointer' }}
                  onClick={() => setPreview(preview?.doc_type === s.doc_type ? null : s)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#00D4FF' }}>{s.doc_type}</span>
                    <Eye size={13} color="var(--text-muted)" />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {Object.keys(s.core_fields || {}).length} core • {Object.keys(s.dynamic_fields || {}).length} dynamic fields
                  </p>
                  <AnimatePresence>
                    {preview?.doc_type === s.doc_type && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>CORE:</p>
                        {Object.entries(s.core_fields || {}).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                            <span className="mono">{k}</span><span style={{ color: '#00D4FF' }}>{v}</span>
                          </div>
                        ))}
                        {Object.keys(s.dynamic_fields || {}).length > 0 && <>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '8px 0 4px', fontWeight: 600 }}>DYNAMIC:</p>
                          {Object.entries(s.dynamic_fields || {}).map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                              <span className="mono">{k}</span><span style={{ color: '#8B5CF6' }}>{v}</span>
                            </div>
                          ))}
                        </>}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
