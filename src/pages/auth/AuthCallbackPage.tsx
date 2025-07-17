import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useNotify } from '../../hooks/useNotify'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const notify = useNotify()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          notify.error('Authentication failed')
          navigate('/auth/login')
          return
        }

        if (data.session) {
          notify.success('Email verified successfully!')
          // Redirect to dashboard instead of landing page
          navigate('/dashboard')
        } else {
          navigate('/auth/login')
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        notify.error('An unexpected error occurred')
        navigate('/auth/login')
      }
    }

    handleAuthCallback()
  }, [navigate, notify])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Authenticating...</h2>
        <p className="text-gray-600">Please wait while we complete your sign in.</p>
      </div>
    </div>
  )
}
