import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuthContext } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { SparklesIcon, UserPlusIcon, BriefcaseIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const schema = yup.object({
  fullName: yup.string().required('Full name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  role: yup.string().oneOf(['customer', 'worker']).required('Please select a role'),
  agreeToTerms: yup.boolean().oneOf([true], 'You must agree to the terms and conditions')
})

type FormData = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  role: 'customer' | 'worker'
  agreeToTerms: boolean
}

export function SignupForm() {
  const { signUp } = useAuthContext()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      role: 'customer'
    }
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const { error } = await signUp(data.email, data.password, data.fullName, data.role as 'customer' | 'worker')
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Account created! Please check your email to verify your account.')
        navigate('/auth/verify-email')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 relative overflow-hidden py-12">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative max-w-lg w-full mx-4">
        <div className="card-elevated p-8 space-y-8 animate-fade-in">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl mb-6">
              <UserPlusIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Join Sweeper</h1>
            <p className="text-gray-600">
              Create your professional cleaning account
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Already have an account?{' '}
              <Link
                to="/auth/login"
                className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700">
                  Full Name
                </label>
                <input
                  {...register('fullName')}
                  type="text"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 text-gray-900 placeholder-gray-500"
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="text-sm text-red-500 font-medium animate-fade-in">{errors.fullName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 text-gray-900 placeholder-gray-500"
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 font-medium animate-fade-in">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 text-gray-900 placeholder-gray-500"
                  placeholder="Create a strong password"
                />
                {errors.password && (
                  <p className="text-sm text-red-500 font-medium animate-fade-in">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                  Confirm Password
                </label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 text-gray-900 placeholder-gray-500"
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 font-medium animate-fade-in">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Choose Your Role
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="relative cursor-pointer">
                  <input
                    {...register('role')}
                    type="radio"
                    value="customer"
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-xl transition-all duration-300 ${
                    selectedRole === 'customer' 
                      ? 'border-emerald-500 bg-emerald-50 shadow-lg' 
                      : 'border-gray-200 hover:border-emerald-300'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <SparklesIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Customer</h3>
                        <p className="text-sm text-gray-500">Book cleaning services</p>
                      </div>
                    </div>
                  </div>
                </label>
                
                <label className="relative cursor-pointer">
                  <input
                    {...register('role')}
                    type="radio"
                    value="worker"
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-xl transition-all duration-300 ${
                    selectedRole === 'worker' 
                      ? 'border-emerald-500 bg-emerald-50 shadow-lg' 
                      : 'border-gray-200 hover:border-emerald-300'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <BriefcaseIcon className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Worker</h3>
                        <p className="text-sm text-gray-500">Provide cleaning services</p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
              {errors.role && (
                <p className="text-sm text-red-500 font-medium animate-fade-in">{errors.role.message}</p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <input
                  {...register('agreeToTerms')}
                  type="checkbox"
                  className="h-5 w-5 mt-0.5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded transition-colors"
                />
                <label htmlFor="agreeToTerms" className="text-sm text-gray-700 leading-relaxed">
                  I agree to the{' '}
                  <Link to="/terms" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-red-500 font-medium animate-fade-in">{errors.agreeToTerms.message}</p>
              )}
            </div>

            {/* Create Account Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              loadingText="Creating your account..."
              glow
              className="mt-8"
            >
              Create Sweeper Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}