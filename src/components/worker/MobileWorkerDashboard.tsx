import { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Worker, Booking } from '../../types'
import { useNotify } from '../../hooks/useNotify'
import { LocationTracker } from './LocationTracker'
import {
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  BellIcon,
  HomeIcon,
  ListBulletIcon,
  DevicePhoneMobileIcon,
  WifiIcon,
  SignalIcon,
} from '@heroicons/react/24/outline'

export function MobileWorkerDashboard() {
  const { profile } = useAuthContext()
  const [worker, setWorker] = useState<Worker | null>(null)
  const [assignments, setAssignments] = useState<(Booking & { profiles?: { full_name: string; phone?: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'jobs' | 'tracking' | 'stats'>('jobs')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const notify = useNotify()

  useEffect(() => {
    if (profile) {
      fetchWorkerData()
      
      // Set up real-time subscriptions
      const assignmentsSubscription = supabase
        .channel('worker_assignments')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'bookings',
          filter: `worker_id=eq.${worker?.id}`
        }, () => {
          fetchAssignments()
        })
        .subscribe()

      return () => {
        assignmentsSubscription.unsubscribe()
      }
    }
  }, [profile, worker?.id])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      notify.success('Back online')
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      notify.error('Connection lost - working offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [notify])

  const fetchWorkerData = async () => {
    if (!profile) return
    
    setLoading(true)
    
    try {
      // Fetch worker profile
      const { data: workerData, error: workerError } = await supabase
        .from('workers')
        .select('*')
        .eq('profile_id', profile.id)
        .single()

      if (workerError) throw workerError
      
      setWorker(workerData)
      await fetchAssignments()
    } catch (error) {
      console.error('Error fetching worker data:', error)
      notify.error('Failed to load worker data')
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignments = async () => {
    if (!worker) return

    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles!bookings_user_id_fkey(full_name, phone)
        `)
        .eq('worker_id', worker.id)
        .in('status', ['assigned', 'en_route', 'in_progress'])
        .order('scheduled_date', { ascending: true })

      if (error) throw error
      
      setAssignments(bookings || [])
    } catch (error) {
      console.error('Error fetching assignments:', error)
      notify.error('Failed to load assignments')
    }
  }

  const updateWorkerStatus = async (status: Worker['status']) => {
    if (!worker) return

    try {
      const { error } = await supabase
        .from('workers')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', worker.id)

      if (error) throw error

      setWorker({ ...worker, status })
      notify.success(`Status updated to ${status.replace('_', ' ')}`)
    } catch (error) {
      console.error('Error updating worker status:', error)
      notify.error('Failed to update status')
    }
  }

  const updateAssignmentStatus = async (bookingId: string, status: Booking['status']) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) throw error

      notify.success(`Job status updated to ${status.replace('_', ' ')}`)
      fetchAssignments()
    } catch (error) {
      console.error('Error updating assignment status:', error)
      notify.error('Failed to update job status')
    }
  }

  const handleLocationToggle = (enabled: boolean) => {
    setLocationEnabled(enabled)
    if (enabled && worker) {
      // Auto-set status to available when location tracking is enabled
      if (worker.status === 'offline') {
        updateWorkerStatus('available')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Worker Profile Not Found</h2>
          <p className="text-gray-600">Please contact your administrator to set up your worker profile.</p>
        </div>
      </div>
    )
  }

  const statusConfig = {
    available: { label: 'Available', color: 'green', icon: PlayCircleIcon },
    en_route: { label: 'En Route', color: 'blue', icon: ArrowRightIcon },
    on_job: { label: 'On Job', color: 'purple', icon: CheckCircleIcon },
    break: { label: 'On Break', color: 'yellow', icon: PauseCircleIcon },
    offline: { label: 'Offline', color: 'gray', icon: XCircleIcon }
  }

  const currentStatus = statusConfig[worker.status]
  const nextAssignment = assignments[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {profile?.full_name || 'Worker'}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-2 h-2 rounded-full bg-${currentStatus.color}-500`}></div>
                <span className="text-sm text-gray-600">{currentStatus.label}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Connection Status */}
              <div className={`p-2 rounded-full ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
                <WifiIcon className={`h-4 w-4 ${isOnline ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              
              {/* Notifications */}
              <button className="p-2 rounded-full bg-gray-100">
                <BellIcon className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Status Bar */}
      <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{assignments.length}</div>
            <div className="text-xs text-gray-600">Active Jobs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {locationEnabled ? 'ON' : 'OFF'}
            </div>
            <div className="text-xs text-gray-600">GPS Tracking</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
            <div className="text-xs text-gray-600">Connection</div>
          </div>
        </div>
      </div>

      {/* Status Controls */}
      <div className="mx-4 mt-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Status</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(statusConfig).map(([status, config]) => (
              <button
                key={status}
                onClick={() => updateWorkerStatus(status as Worker['status'])}
                className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  worker.status === status
                    ? `bg-${config.color}-100 text-${config.color}-800 border-2 border-${config.color}-300`
                    : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <config.icon className="h-4 w-4 mr-2" />
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mx-4 mt-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { key: 'jobs', label: 'Jobs', icon: ListBulletIcon },
            { key: 'tracking', label: 'Tracking', icon: MapPinIcon },
            { key: 'stats', label: 'Stats', icon: CheckCircleIcon }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mx-4 mt-4 pb-20">
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No active assignments</p>
                <p className="text-sm text-gray-400 mt-2">
                  Set your status to "Available" to receive new jobs
                </p>
              </div>
            ) : (
              assignments.map((assignment) => (
                <MobileJobCard
                  key={assignment.id}
                  assignment={assignment}
                  onUpdateStatus={updateAssignmentStatus}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'tracking' && (
          <LocationTracker
            workerId={worker.id}
            isActive={locationEnabled}
            onToggle={handleLocationToggle}
          />
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{assignments.length}</div>
                  <div className="text-sm text-gray-600">Jobs Assigned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {assignments.filter(a => a.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-600">Hours Worked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">0</div>
                  <div className="text-sm text-gray-600">Miles Driven</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MobileJobCard({ 
  assignment, 
  onUpdateStatus 
}: { 
  assignment: Booking & { profiles?: { full_name: string; phone?: string } }
  onUpdateStatus: (bookingId: string, status: Booking['status']) => void 
}) {
  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'assigned': return 'en_route'
      case 'en_route': return 'in_progress'
      case 'in_progress': return 'completed'
      default: return null
    }
  }

  const nextStatus = getNextStatus(assignment.status)
  const statusColors = {
    assigned: 'bg-blue-100 text-blue-800',
    en_route: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900">
            {assignment.service_type.replace('_', ' ').toUpperCase()}
          </h3>
          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColors[assignment.status as keyof typeof statusColors]}`}>
            {assignment.status.replace('_', ' ')}
          </span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">${assignment.price}</div>
          <div className="text-xs text-gray-500">
            {assignment.scheduled_date}
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center">
          <MapPinIcon className="h-4 w-4 mr-2" />
          <span className="flex-1">{assignment.address}</span>
        </div>
        <div className="flex items-center">
          <ClockIcon className="h-4 w-4 mr-2" />
          <span>{assignment.scheduled_time}</span>
        </div>
        <div className="flex items-center">
          <PhoneIcon className="h-4 w-4 mr-2" />
          <span>{assignment.profiles?.full_name}</span>
          {assignment.profiles?.phone && (
            <span className="ml-1">- {assignment.profiles.phone}</span>
          )}
        </div>
      </div>

      <div className="flex space-x-2">
        {nextStatus && (
          <button
            onClick={() => onUpdateStatus(assignment.id, nextStatus as Booking['status'])}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            {nextStatus === 'en_route' && 'Start Trip'}
            {nextStatus === 'in_progress' && 'Arrive'}
            {nextStatus === 'completed' && 'Complete'}
          </button>
        )}
        
        <button
          onClick={() => {
            const address = encodeURIComponent(assignment.address)
            window.open(`https://maps.google.com/maps?q=${address}`, '_blank')
          }}
          className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}