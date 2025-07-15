import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EnvelopeIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useAuthContext } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import toast from 'react-hot-toast'

export default function VerifyEmailPage() {
  const { user, resendVerificationEmail } = useAuthContext()
  const [isResending, setIsResending] = useState(false)
  const [resendCount, setResendCount] = useState(0)
  const [lastResend, setLastResend] = useState<Date | null>(null)

  const handleResendEmail = async () => {
    if (!user?.email) {
      toast.error('No email address found')
      return
    }

    // Rate limiting: Allow only 3 resends per hour
    if (resendCount >= 3) {
      toast.error('Maximum resend attempts reached. Please wait before trying again.')
      return
    }

    // Rate limiting: Wait 60 seconds between resends
    if (lastResend && Date.now() - lastResend.getTime() < 60000) {
      const remainingTime = Math.ceil((60000 - (Date.now() - lastResend.getTime())) / 1000)
      toast.error(`Please wait ${remainingTime} seconds before resending`)
      return
    }

    setIsResending(true)
    
    try {
      const { error } = await resendVerificationEmail()
      
      if (error) {
        toast.error(error.message || 'Failed to resend verification email')
      } else {
        toast.success('Verification email sent successfully!')
        setResendCount(prev => prev + 1)
        setLastResend(new Date())
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 shadow-xl">
            <EnvelopeIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold gradient-text">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-readable-muted">
            We've sent a verification link to <span className="font-semibold text-readable">{user?.email}</span>. 
            Please click the link to verify your account.
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="card-elevated p-4">
            <div className="text-sm">
              <p className="font-semibold text-readable mb-2 flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2 text-emerald-500" />
                Didn't receive the email?
              </p>
              <ul className="list-disc list-inside space-y-1 text-readable-muted">
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>Wait a few minutes for the email to arrive</li>
              </ul>
            </div>
          </div>

          <div className="text-center space-y-4">
            <Button
              onClick={handleResendEmail}
              loading={isResending}
              loadingText="Resending..."
              disabled={resendCount >= 3}
              variant="secondary"
              className="w-full"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              {resendCount >= 3 ? 'Maximum attempts reached' : 'Resend verification email'}
            </Button>

            {resendCount > 0 && (
              <p className="text-xs text-readable-muted">
                Resent {resendCount} time{resendCount !== 1 ? 's' : ''} 
                {resendCount >= 3 && ' (limit reached)'}
              </p>
            )}

            <div className="border-t pt-4">
              <Link
                to="/auth/login"
                className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
