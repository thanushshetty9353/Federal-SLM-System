import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical, Cpu, Zap, ChevronRight, RefreshCw,
  Upload, AlertCircle, CheckCircle2, Layers
} from 'lucide-react'
import { modelTestApi } from '../../api/modelTest'
import { Loader } from '../../components/ui/Loader'
import GlassCard from '../../components/ui/GlassCard'
import ModelUploader  from './modelTest/ModelUploader'
import SchemaSelector from './modelTest/SchemaSelector'
import FeatureInputs  from './modelTest/FeatureInputs'
import PredictionResult from './modelTest/PredictionResult'
import ModelSwitcher  from './modelTest/ModelSwitcher'
import PredictionHistory from './modelTest/PredictionHistory'
import toast from 'react-hot-toast'

// Panel step indicator
function StepBadge({ step, active, done }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700,
      background: done ? 'rgba(16,185,129,0.18)' : active ? 'rgba(0,212,255,0.18)' : 'var(--bg-card)',
      border: done ? '1px solid rgba(16,185,129,0.4)' : active ? '1px solid rgba(0,212,255,0.4)' : '1px solid var(--border-color)',
      color: done ? '#10B981' : active ? 'var(--neon-blue)' : 'var(--text-muted)',
    }}>
      {done ? <CheckCircle2 size={14} /> : step}
    </div>
  )
}

function SectionHeader({ step, active, done, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <StepBadge step={step} active={active} done={done} />
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: active || done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {title}
        </p>
        {subtitle && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>}
      </div>
    </div>
  )
}

export default function ModelTestingPage() {
  const [models, setModels]           = useState([])
  const [activeModel, setActiveModel] = useState(null)
  const [loadingModels, setLoadingModels] = useState(true)

  const [showUploader, setShowUploader] = useState(false)

  const [selectedSchema, setSelectedSchema] = useState(null)
  const [targetField,    setTargetField]    = useState('')
  const [featureValues,  setFeatureValues]  = useState({})

  const [predicting,       setPredicting]       = useState(false)
  const [predictionResult, setPredictionResult] = useState(null)
  const [history,          setHistory]          = useState([])

  const resultRef = useRef(null)

  // ─── Load models on mount ───────────────────────────────
  const loadModels = async () => {
    setLoadingModels(true)
    try {
      const res = await modelTestApi.getModels()
      const data = res.data || []
      setModels(data)
      if (!activeModel && data.length > 0) setActiveModel(data[0])
    } catch { toast.error('Failed to load models') }
    finally { setLoadingModels(false) }
  }

  useEffect(() => { loadModels() }, [])

  // ─── Reset feature values when schema/target changes ───
  useEffect(() => { setFeatureValues({}) }, [selectedSchema, targetField])

  // ─── Upload callback ────────────────────────────────────
  const handleModelUploaded = (newModel) => {
    setModels(prev => [newModel, ...prev])
    setActiveModel(newModel)
    setShowUploader(false)
    toast.success(`"${newModel.name}" is now active`)
  }

  // ─── Delete model ───────────────────────────────────────
  const handleDeleteModel = async (id) => {
    try {
      await modelTestApi.deleteModel(id)
      const updated = models.filter(m => m.id !== id)
      setModels(updated)
      if (activeModel?.id === id) setActiveModel(updated[0] || null)
      toast.success('Model removed')
    } catch { toast.error('Failed to delete model') }
  }

  // ─── Predict ────────────────────────────────────────────
  const handlePredict = async () => {
    if (!activeModel) return toast.error('Select or upload a model first')
    if (!selectedSchema) return toast.error('Select a schema first')
    if (!targetField) return toast.error('Choose a target field')

    // Validate all input fields are filled
    const allFields = { ...(selectedSchema.core_fields||{}), ...(selectedSchema.dynamic_fields||{}) }
    const inputKeys = Object.keys(allFields).filter(k => k !== targetField)
    const missing   = inputKeys.filter(k => featureValues[k] === undefined || featureValues[k] === '')
    if (missing.length > 0) {
      toast.error(`Fill in: ${missing.slice(0,3).join(', ')}${missing.length > 3 ? '…' : ''}`)
      return
    }

    // Parse values to numbers where needed
    const parsedFeatures = {}
    inputKeys.forEach(k => {
      const t = allFields[k]
      const v = featureValues[k]
      if (t === 'float')  parsedFeatures[k] = parseFloat(v)
      else if (t === 'int') parsedFeatures[k] = parseInt(v, 10)
      else if (t === 'bool') parsedFeatures[k] = v === 'true'
      else parsedFeatures[k] = v
    })

    setPredicting(true)
    try {
      const res = await modelTestApi.predict({
        model_id:     activeModel.id,
        schema_id:    selectedSchema.doc_type,
        target_field: targetField,
        features:     parsedFeatures,
      })
      const result = res.data
      setPredictionResult(result)

      // Add to history
      const entry = {
        id:         Date.now(),
        model_name: activeModel.name,
        schema:     selectedSchema.doc_type,
        target_field: targetField,
        prediction: result.prediction,
        confidence: result.confidence,
        timestamp:  new Date().toISOString(),
      }
      setHistory(h => [entry, ...h])

      // Scroll to result
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior:'smooth', block:'center' }), 100)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Prediction failed')
    } finally { setPredicting(false) }
  }

  // ─── Derived state ──────────────────────────────────────
  const hasModels       = models.length > 0
  const hasSchema       = !!selectedSchema
  const hasTarget       = !!targetField
  const allFields       = selectedSchema ? { ...(selectedSchema.core_fields||{}), ...(selectedSchema.dynamic_fields||{}) } : {}
  const inputFieldCount = Object.keys(allFields).filter(k => k !== targetField).length
  const allFilled       = inputFieldCount > 0 &&
    Object.keys(allFields).filter(k => k !== targetField)
          .every(k => featureValues[k] !== undefined && featureValues[k] !== '')

  const canPredict = hasModels && hasSchema && hasTarget && allFilled && !predicting

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24, maxWidth:1300, margin:'0 auto' }}>

      {/* ── Page Header ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
        style={{
          padding:'20px 24px', borderRadius:18,
          background:'linear-gradient(135deg,rgba(0,212,255,0.08),rgba(139,92,246,0.08))',
          border:'1px solid rgba(0,212,255,0.18)',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{
            width:48, height:48, borderRadius:14,
            background:'linear-gradient(135deg,rgba(0,212,255,0.2),rgba(139,92,246,0.2))',
            border:'1px solid rgba(0,212,255,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 20px rgba(0,212,255,0.15)',
          }}>
            <FlaskConical size={22} color="var(--neon-blue)" />
          </div>
          <div>
            <h1 style={{ fontSize:20, fontWeight:900, color:'var(--text-primary)', margin:0 }}>
              AI Model <span className="text-gradient">Testing Lab</span>
            </h1>
            <p style={{ fontSize:12, color:'var(--text-secondary)', marginTop:3 }}>
              Upload trained models · Select schema · Run inference
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          {[
            { label:'Models',     value: models.length,  color:'var(--neon-blue)'   },
            { label:'Predictions',value: history.length, color:'var(--neon-purple)' },
            { label:'Active',     value: activeModel ? '1' : '0', color:'#10B981'  },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign:'center' }}>
              <p style={{ fontSize:20, fontWeight:800, color, lineHeight:1 }}>{value}</p>
              <p style={{ fontSize:10, color:'var(--text-muted)', marginTop:2, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Main Layout ───────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,380px)', gap:20, alignItems:'start' }}>

        {/* LEFT COLUMN */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* STEP 1: Models */}
          <GlassCard>
            <SectionHeader step={1} active={!hasModels || showUploader} done={hasModels && !showUploader}
              title="Upload & Select Model"
              subtitle="Supported: .pkl · .joblib · .pt · .onnx" />

            {/* Uploader toggle */}
            <AnimatePresence>
              {(showUploader || !hasModels) && (
                <motion.div
                  initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                  exit={{ opacity:0, height:0 }} style={{ marginBottom: hasModels ? 16 : 0 }}
                >
                  <ModelUploader onModelUploaded={handleModelUploaded} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Model list */}
            {loadingModels ? (
              <div style={{ display:'flex', justifyContent:'center', padding:'12px 0' }}><Loader size="sm" /></div>
            ) : (
              <ModelSwitcher
                models={models}
                activeModel={activeModel}
                onSelect={(m) => { setActiveModel(m); setShowUploader(false) }}
                onDelete={handleDeleteModel}
                onUploadAnother={() => setShowUploader(true)}
              />
            )}
          </GlassCard>

          {/* STEP 2: Schema */}
          <GlassCard>
            <SectionHeader step={2} active={hasModels && !hasSchema} done={hasSchema && hasTarget}
              title="Select Schema & Target"
              subtitle="Choose the dataset schema and prediction target field" />
            <SchemaSelector
              selectedSchema={selectedSchema}
              targetField={targetField}
              onSchemaChange={setSelectedSchema}
              onTargetChange={setTargetField}
            />
          </GlassCard>

          {/* STEP 3: Feature Inputs */}
          <AnimatePresence>
            {hasSchema && hasTarget && (
              <motion.div
                initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:12 }}
              >
                <GlassCard>
                  <SectionHeader step={3} active={!allFilled} done={allFilled}
                    title="Enter Feature Values"
                    subtitle={`Fill in ${inputFieldCount} input field${inputFieldCount !== 1 ? 's' : ''}`} />
                  <FeatureInputs
                    schema={selectedSchema}
                    targetField={targetField}
                    values={featureValues}
                    onChange={setFeatureValues}
                  />
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STEP 4: Predict Button */}
          <AnimatePresence>
            {hasSchema && hasTarget && (
              <motion.div
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0 }}
              >
                <motion.button
                  id="predict-btn"
                  whileHover={canPredict ? { scale:1.01, boxShadow:'0 8px 30px rgba(0,212,255,0.35)' } : {}}
                  whileTap={canPredict ? { scale:0.98 } : {}}
                  onClick={handlePredict}
                  disabled={!canPredict}
                  className="btn btn-primary btn-lg"
                  style={{
                    width:'100%', gap:10, fontSize:15, borderRadius:14,
                    position:'relative', overflow:'hidden',
                    opacity: canPredict ? 1 : 0.55,
                  }}
                >
                  {predicting ? (
                    <><Loader size="sm" /> Running Inference…</>
                  ) : (
                    <><Zap size={17} /> Run Prediction</>
                  )}
                  {/* Shimmer on hover */}
                  {canPredict && (
                    <motion.div
                      style={{
                        position:'absolute', inset:0, pointerEvents:'none',
                        background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)',
                        backgroundSize:'200% 100%',
                      }}
                      animate={{ backgroundPosition:['200% 0','−200% 0'] }}
                      transition={{ duration:2, repeat:Infinity, ease:'linear' }}
                    />
                  )}
                </motion.button>

                {/* Validation hint */}
                {!canPredict && !predicting && (
                  <p style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', marginTop:8, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                    <AlertCircle size={11} />
                    {!hasModels ? 'Upload a model' : !hasSchema ? 'Select a schema' : !hasTarget ? 'Choose a target field' : 'Fill in all feature fields'}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Active model card */}
          <motion.div
            initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }}
          >
            <GlassCard style={{ padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: activeModel ? 14 : 0 }}>
                <Cpu size={15} color="var(--neon-purple)" />
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>Active Model</span>
                {activeModel && (
                  <motion.div
                    animate={{ scale:[1,1.3,1], opacity:[1,0.6,1] }}
                    transition={{ duration:1.8, repeat:Infinity }}
                    style={{ width:7, height:7, borderRadius:'50%', background:'#10B981', boxShadow:'0 0 8px #10B981', marginLeft:'auto' }}
                  />
                )}
              </div>

              {activeModel ? (
                <div style={{ padding:'14px', borderRadius:12, background:'rgba(0,212,255,0.05)', border:'1px solid rgba(0,212,255,0.15)' }}>
                  <p style={{ fontSize:14, fontWeight:800, color:'var(--neon-blue)', marginBottom:6 }}>{activeModel.name}</p>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <span className="badge badge-blue">.{activeModel.format}</span>
                    {activeModel.schema_doc_type && <span className="badge badge-purple">{activeModel.schema_doc_type}</span>}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize:13, color:'var(--text-muted)' }}>No model selected. Upload one to begin.</p>
              )}
            </GlassCard>
          </motion.div>

          {/* Prediction result */}
          <div ref={resultRef}>
            <AnimatePresence mode="wait">
              {predictionResult && (
                <PredictionResult key={predictionResult.prediction + predictionResult.confidence} result={predictionResult} />
              )}
            </AnimatePresence>

            {!predictionResult && (
              <motion.div
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                style={{
                  padding:'40px 24px', borderRadius:20, textAlign:'center',
                  background:'var(--bg-card)', border:'1px dashed var(--border-color)',
                }}
              >
                <FlaskConical size={32} style={{ margin:'0 auto 12px', display:'block', opacity:0.2 }} />
                <p style={{ fontSize:13, color:'var(--text-muted)' }}>
                  Prediction result will appear here after inference
                </p>
              </motion.div>
            )}
          </div>

          {/* Quick guide */}
          <motion.div
            initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }}
          >
            <GlassCard style={{ padding:18 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <Layers size={14} color="var(--neon-green)" />
                <span style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>Quick Guide</span>
              </div>
              {[
                ['1', 'Upload your trained model (.pkl, .joblib, .pt, .onnx)'],
                ['2', 'Select the schema matching your training dataset'],
                ['3', 'Pick the target/label field to predict'],
                ['4', 'Fill in feature values and hit Run Prediction'],
              ].map(([n, text]) => (
                <div key={n} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'flex-start' }}>
                  <div style={{
                    width:20, height:20, borderRadius:6, flexShrink:0,
                    background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:10, fontWeight:800, color:'#10B981',
                  }}>{n}</div>
                  <span style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>{text}</span>
                </div>
              ))}
            </GlassCard>
          </motion.div>
        </div>
      </div>

      {/* ── Prediction History ────────────────────────────── */}
      <AnimatePresence>
        {history.length > 0 && (
          <motion.div
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:16 }}
          >
            <GlassCard>
              <PredictionHistory history={history} onClear={() => setHistory([])} />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
