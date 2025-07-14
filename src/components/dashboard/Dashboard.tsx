import React from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { CustomerDashboard } from '../customer/CustomerDashboard'
import { WorkerDashboard } from '../worker/WorkerDashboard'
import { AdminDashboard } from '../admin/AdminDashboard'

export function Dashboard() {
  const { profile } = useAuthContext()

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  switch (profile.role) {
    case 'customer':
      return <CustomerDashboard />
    case 'worker':
      return <WorkerDashboard />
    case 'admin':
      return <AdminDashboard />
    default:
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Welcome to Sweeper</h2>
          <p className="mt-2 text-gray-600">Your role is not recognized. Please contact support.</p>
        </div>
      )
  }
}
