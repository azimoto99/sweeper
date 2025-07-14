import { useState } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { useNotify } from '../../hooks/useNotify'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function EmailVerificationBanner() {
  const { user, isVerified, resendVerificationEmail } = useAuthContext()
  const [isResending, setIsResending] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const notify = useNotify()

  if (!user || isVerified || isDismissed) {
    return null
  }

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      const { error } = await resendVerificationEmail()
      if (error) {
        notify.error(error.message)
      } else {
        notify.success('Verification email sent!')
      }
    } catch (error) {
      notify.error('Failed to send verification email')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700">
            Please verify your email address to access all features.{' '}
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="font-medium underline text-yellow-700 hover:text-yellow-600 disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend verification email'}
            </button>
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={() => setIsDismissed(true)}
              className="inline-flex bg-yellow-50 rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
