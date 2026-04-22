import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Loader } from './components/ui/Loader'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Layout
import DashboardLayout from './components/layout/DashboardLayout'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import JobManagement from './pages/admin/JobManagement'
import UserManagement from './pages/admin/UserManagement'
import SchemaBuilder from './pages/admin/SchemaBuilder'
import ModelAccessPage from './pages/admin/ModelAccessPage'
import AdminDownloadsPage from './pages/admin/AdminDownloadsPage'

// ORG Pages
import OrgDashboard from './pages/org/OrgDashboard'
import JobBoard from './pages/org/JobBoard'
import DocumentUpload from './pages/org/DocumentUpload'
import TrainingPage from './pages/org/TrainingPage'
import DownloadsPage from './pages/org/DownloadsPage'

// Researcher Pages
import ResearcherDashboard from './pages/researcher/ResearcherDashboard'
import ResearcherDownloadsPage from './pages/researcher/ResearcherDownloadsPage'

// Shared Pages
import AnalyticsDashboard from './pages/shared/AnalyticsDashboard'
import BlockchainAuditor from './pages/shared/BlockchainAuditor'
import GlobalModelViewer from './pages/shared/GlobalModelViewer'

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="bg-mesh" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader size="lg" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />
  return children
}

const HomeRedirect = () => {
  const { user, loading } = useAuth()
  if (loading) return <div className="bg-mesh" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader size="lg" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
  if (user.role === 'ORG') return <Navigate to="/org/dashboard" replace />
  if (user.role === 'RESEARCHER') return <Navigate to="/researcher/dashboard" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<HomeRedirect />} />

      {/* Admin */}
      <Route path="/admin" element={<PrivateRoute roles={['ADMIN']}><DashboardLayout /></PrivateRoute>}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="jobs" element={<JobManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="schema" element={<SchemaBuilder />} />
        <Route path="model-access" element={<ModelAccessPage />} />
        <Route path="downloads" element={<AdminDownloadsPage />} />
        <Route path="blockchain" element={<BlockchainAuditor />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* ORG */}
      <Route path="/org" element={<PrivateRoute roles={['ORG']}><DashboardLayout /></PrivateRoute>}>
        <Route path="dashboard" element={<OrgDashboard />} />
        <Route path="jobs" element={<JobBoard />} />
        <Route path="upload" element={<DocumentUpload />} />
        <Route path="training" element={<TrainingPage />} />
        <Route path="downloads" element={<DownloadsPage />} />
        <Route path="blockchain" element={<BlockchainAuditor />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Researcher */}
      <Route path="/researcher" element={<PrivateRoute roles={['RESEARCHER']}><DashboardLayout /></PrivateRoute>}>
        <Route path="dashboard" element={<ResearcherDashboard />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="blockchain" element={<BlockchainAuditor />} />
        <Route path="global-model" element={<GlobalModelViewer />} />
        <Route path="downloads" element={<ResearcherDownloadsPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
