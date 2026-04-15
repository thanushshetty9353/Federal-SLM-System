import { FileText, Activity } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'

export default function AnalyticsDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <GlassCard style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,212,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Activity size={32} color="#00D4FF" />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Analytics Processing</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto' }}>
          Valid and proper analytics data is currently being gathered from active nodes. 
          Charts and statistics will appear here automatically once sufficient data is verified.
        </p>
      </GlassCard>
    </div>
  )
}
