import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="login-note">Loading...</p>
  }

  if (!user) {
    const from =
      location.pathname.startsWith('/verify/') || location.pathname === '/login'
        ? '/'
        : location.pathname
    return <Navigate to="/login" replace state={{ from }} />
  }

  return children
}
