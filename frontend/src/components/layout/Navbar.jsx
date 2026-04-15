import { motion } from 'framer-motion'
import { Sun, Moon, LogOut, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useNavigate, useLocation } from 'react-router-dom'

const pageTitles = {
  dashboard: 'Dashboard',
  users: 'User Management',
  schema: 'Schema Builder',
  'model-access': 'Global Model Access',
  upload: 'Document Upload',
  training: 'Local Training',
  downloads: 'Model Downloads',
  blockchain: 'Blockchain Auditor',
  analytics: 'Analytics',
  'global-model': 'Global Model Viewer',
}

const roleColors = {
  ADMIN: { bg: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: 'rgba(139,92,246,0.3)' },
  ORG: { bg: 'rgba(0,212,255,0.15)', color: '#00D4FF', border: 'rgba(0,212,255,0.3)' },
  RESEARCHER: { bg: 'rgba(16,185,129,0.15)', color: '#10B981', border: 'rgba(16,185,129,0.3)' },
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const segment = location.pathname.split('/').pop()
  const title = pageTitles[segment] || 'Dashboard'
  const roleStyle = roleColors[user?.role] || roleColors.ORG

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="glass-nav" style={{ padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
      {/* Left: page title */}
      <motion.div
        key={title}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Role Badge */}
        <div style={{ padding: '4px 12px', borderRadius: 20, background: roleStyle.bg, border: `1px solid ${roleStyle.border}`, color: roleStyle.color, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {user?.role}
        </div>

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </motion.button>

        {/* User Avatar */}
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${roleStyle.color}66, ${roleStyle.color}22)`, border: `1px solid ${roleStyle.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: roleStyle.color }}>
          {(user?.email || 'U')[0].toUpperCase()}
        </div>

        {/* Logout */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EF4444' }}
        >
          <LogOut size={16} />
        </motion.button>
      </div>
    </header>
  )
}
