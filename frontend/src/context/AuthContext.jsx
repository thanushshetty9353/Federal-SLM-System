import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { jwtDecode } from 'jwt-decode'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../api/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token)
        const now = Date.now() / 1000
        if (decoded.exp && decoded.exp < now) {
          clearAuth()
        } else {
          setUser(decoded)
        }
      } catch {
        clearAuth()
      }
    }
    setLoading(false)
  }, [token])

  const clearAuth = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password })
    const { access_token } = res.data
    localStorage.setItem('token', access_token)
    setToken(access_token)
    const decoded = jwtDecode(access_token)
    setUser(decoded)
    return decoded
  }, [])

  const register = useCallback(async (data) => {
    const res = await authApi.register(data)
    return res.data
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    toast.success('Logged out successfully')
  }, [clearAuth])

  const isAdmin = user?.role === 'ADMIN'
  const isOrg = user?.role === 'ORG'
  const isResearcher = user?.role === 'RESEARCHER'
  const canDownloadGlobal = user?.can_download_global || isAdmin

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, logout, register,
      isAdmin, isOrg, isResearcher, canDownloadGlobal,
      clearAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
