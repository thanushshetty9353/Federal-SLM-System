import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, FileText, Brain, Download,
  Link2, BarChart3, Globe, ChevronLeft, ChevronRight,
  Shield, Upload, Database, Settings, Briefcase
} from 'lucide-react'

const adminNav = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Jobs', icon: Briefcase, to: '/admin/jobs' },
  { label: 'User Management', icon: Users, to: '/admin/users' },
  { label: 'Schema Builder', icon: Database, to: '/admin/schema' },
  { label: 'Model Access', icon: Settings, to: '/admin/model-access' },
  { label: 'Blockchain', icon: Link2, to: '/admin/blockchain' },
  { label: 'Analytics', icon: BarChart3, to: '/admin/analytics' },
]

const orgNav = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/org/dashboard' },
  { label: 'Jobs', icon: Briefcase, to: '/org/jobs' },
  { label: 'Upload Docs', icon: Upload, to: '/org/upload' },
  { label: 'Training', icon: Brain, to: '/org/training' },
  { label: 'Downloads', icon: Download, to: '/org/downloads' },
  { label: 'Blockchain', icon: Link2, to: '/org/blockchain' },
]

const researcherNav = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/researcher/dashboard' },
  { label: 'Analytics', icon: BarChart3, to: '/researcher/analytics' },
  { label: 'Blockchain', icon: Link2, to: '/researcher/blockchain' },
  { label: 'Global Model', icon: Globe, to: '/researcher/global-model' },
]

const roleColors = {
  ADMIN: { accent: '#8B5CF6', label: 'Administrator' },
  ORG: { accent: '#00D4FF', label: 'Organization' },
  RESEARCHER: { accent: '#10B981', label: 'Researcher' },
}

export default function Sidebar() {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const role = user?.role || 'ORG'
  const nav = role === 'ADMIN' ? adminNav : role === 'ORG' ? orgNav : researcherNav
  const { accent, label } = roleColors[role] || roleColors.ORG

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="glass-sidebar flex flex-col h-screen sticky top-0 overflow-hidden shrink-0 z-30"
      style={{ minHeight: '100vh' }}
    >
      {/* Logo */}
      <div style={{ padding: collapsed ? '24px 16px' : '24px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <motion.div
          animate={{ rotate: collapsed ? 0 : 360 }}
          transition={{ duration: 0.6 }}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${accent}, #0A0E1A)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 16px ${accent}55`, flexShrink: 0
          }}
        >
          <Shield size={18} color="#fff" />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1 }}>FedDI</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Intel Platform</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Role Badge */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ margin: '12px 14px', padding: '8px 12px', borderRadius: 10, background: `${accent}18`, border: `1px solid ${accent}33` }}
          >
            <div style={{ fontSize: 10, color: accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || 'user@feddi.io'}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: collapsed ? '10px 0' : '10px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 10,
                  background: isActive ? `${accent}18` : 'transparent',
                  border: `1px solid ${isActive ? `${accent}44` : 'transparent'}`,
                  color: isActive ? accent : 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <item.icon size={18} style={{ flexShrink: 0 }} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap' }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="activeIndicator"
                    style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: accent, boxShadow: `0 0 8px ${accent}` }}
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          margin: '12px 10px', padding: '10px', borderRadius: 10,
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
        }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </motion.aside>
  )
}
