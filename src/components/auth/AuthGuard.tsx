import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'
import { User } from '../../types'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, profile } = useAuthContext()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return <>{children}</>
}

export function AdminGuard({ children }: AuthGuardProps) {
  const { profile } = useAuthContext()

  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <AuthGuard>{children}</AuthGuard>
}

export function WorkerGuard({ children }: AuthGuardProps) {
  const { profile } = useAuthContext()

  if (!profile || profile.role !== 'worker') {
    return <Navigate to="/" replace />
  }

  return <AuthGuard>{children}</AuthGuard>
}

export function CustomerGuard({ children }: AuthGuardProps) {
  const { profile } = useAuthContext()

  if (!profile || profile.role !== 'customer') {
    return <Navigate to="/" replace />
  }

  return <AuthGuard>{children}</AuthGuard>
}
