import { motion } from 'framer-motion'
import { Hash, ToggleLeft, Type, Calendar } from 'lucide-react'

const TYPE_ICON = {
  float:  Hash, int: Hash, string: Type, bool: ToggleLeft, date: Calendar,
}
const TYPE_COLOR = {
  float:'#00D4FF', int:'#00D4FF', string:'#8B5CF6', bool:'#10B981', date:'#F59E0B',
}

function FieldIcon({ type }) {
  const Icon  = TYPE_ICON[type] || Hash
  const color = TYPE_COLOR[type] || '#8892A4'
  return (
    <div style={{
      width:32, height:32, borderRadius:8, flexShrink:0,
      background:`${color}18`, border:`1px solid ${color}30`,
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <Icon size={14} color={color} />
    </div>
  )
}

export default function FeatureInputs({ schema, targetField, values, onChange }) {
  if (!schema) return null

  const allFields = { ...(schema.core_fields||{}), ...(schema.dynamic_fields||{}) }

  // Exclude target field
  const inputFields = Object.entries(allFields).filter(([k]) => k !== targetField)

  if (inputFields.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-muted)', fontSize:13 }}>
        No input fields (all fields are the target).
      </div>
    )
  }

  const handleChange = (key, val) => {
    onChange({ ...values, [key]: val })
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {inputFields.map(([key, type], i) => {
        const color = TYPE_COLOR[type] || '#8892A4'
        const isBool = type === 'bool'
        return (
          <motion.div
            key={key}
            initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
            transition={{ delay: i * 0.05 }}
            style={{ display:'flex', alignItems:'center', gap:12 }}
          >
            <FieldIcon type={type} />

            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', fontFamily:'JetBrains Mono,monospace' }}>
                  {key}
                </label>
                <span style={{
                  fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:20,
                  background:`${color}18`, border:`1px solid ${color}30`, color,
                  fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase',
                }}>{type}</span>
              </div>

              {isBool ? (
                <div style={{ display:'flex', gap:8 }}>
                  {['true','false'].map(v => (
                    <button
                      key={v} type="button"
                      onClick={() => handleChange(key, v)}
                      style={{
                        flex:1, padding:'8px 0', borderRadius:8, fontSize:12, fontWeight:600,
                        cursor:'pointer', transition:'all 0.15s',
                        background: values[key] === v ? 'rgba(16,185,129,0.18)' : 'var(--bg-card)',
                        border: values[key] === v ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border-color)',
                        color: values[key] === v ? '#10B981' : 'var(--text-muted)',
                      }}
                    >{v}</button>
                  ))}
                </div>
              ) : (
                <input
                  className="input-field"
                  type={type === 'float' || type === 'int' ? 'number' : type === 'date' ? 'date' : 'text'}
                  step={type === 'float' ? 'any' : undefined}
                  placeholder={
                    type === 'float' ? '0.00' :
                    type === 'int'   ? '0' :
                    type === 'date'  ? 'YYYY-MM-DD' : 'Enter value'
                  }
                  value={values[key] ?? ''}
                  onChange={e => handleChange(key, e.target.value)}
                  style={{ fontSize:13, padding:'9px 12px' }}
                />
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
