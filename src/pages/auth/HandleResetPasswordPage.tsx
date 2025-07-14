import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'
import { useNotify } from '../../hooks/useNotify'

export default function HandleResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isReset, setIsReset] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { updatePassword } = useAuthContext()
  const notify = useNotify()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      notify.error('Passwords do not match.')
      return
    }

    const toastId = notify.loading('Resetting password...')

    try {
      const { error } = await updatePassword(newPassword)
      if (error) {
        notify.error(error.message)
      } else {
        setIsReset(true)
        notify.success('Password reset successfully!')
        setTimeout(() => navigate('/auth/login'), 3000)
      }
    } catch (err) {
      if (err instanceof Error) {
        notify.error(err.message)
      } else {
        notify.error('An unknown error occurred.')
      }
    } finally {
      notify.dismiss(toastId)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center mb-4">Set New Password</h2>
        {isReset ? (
          <p className="text-gray-600 text-center">
            Your password has been reset successfully. You will be redirected to the login page shortly.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="newPassword"
                className="block text-gray-700 font-bold mb-2"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                className="w-full px-3 py-2 border rounded-lg"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="confirmPassword"
                className="block text-gray-700 font-bold mb-2"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="w-full px-3 py-2 border rounded-lg"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600"
            >
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
