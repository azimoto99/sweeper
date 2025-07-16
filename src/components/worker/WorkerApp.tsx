import { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Worker, Booking, Assignment } from '../../types'
import { useNotify } from '../../hooks/useNotify'
import { useLocationTracking } from '../../hooks/useLocationTracking'
import { useBookingNotifications } from '../../hooks/useBookingNotifications'
import { MobileWorkerDashboard } from './MobileWorkerDashboard'
import { PhotoUploader } from './PhotoUploader'
import {
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  SignalIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline'

export function WorkerApp() {
  const { profile } = useAuthContext()
  const [worker, setWorker] = useState<Worker | null>(null)
  const [assignments, setAssignments] = useState<(Assignment & { bookings: Booking })[]>([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [forceMobile, setForceMobile] = useState(false)
  const notify = useNotify()

  // Enable booking notifications for workers
  useBookingNotifications()

  // Use location tracking hook
  const { 
    isTracking, 
    lastUpdate, 
    error: locationError, 
    permissionStatus 
  } = useLocationTracking({
    workerId: worker?.id,
    enabled: worker?.status !== 'offline',
    highAccuracy: true,
    updateInterval: 30000
  })

  useEffect(() => {
    if (profile) {
      fetchWorkerData()
      
      // Set up real-time subscriptions
      const assignmentsSubscription = supabase
        .channel('assignments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
          fetchAssignments()
        })
        .subscribe()

      return () => {
        assignmentsSubscription.unsubscribe()
      }
    }
  }, [profile])

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchWorkerData = async () => {
    if (!profile) return
    
    setLoading(true)
    
    // Fetch worker profile
    const { data: workerData, error: workerError } = await supabase
      .from('workers')
      .select('*')
      .eq('profile_id', profile.id)
      .single()

    if (workerError) {
      console.error('Error fetching worker:', workerError)
      notify.error('Failed to fetch worker data')
    } else {
      setWorker(workerData)
    }

    await fetchAssignments()
    setLoading(false)
  }

  const fetchAssignments = async () => {
    if (!profile) return

    // For MVP, we'll fetch bookings assigned to this worker
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles!bookings_user_id_fkey(full_name, phone)
      `)
      .eq('worker_id', worker?.id)
      .in('status', ['assigned', 'en_route', 'in_progress'])
      .order('scheduled_date', { ascending: true })

    if (error) {
      console.error('Error fetching assignments:', error)
      notify.error('Failed to fetch assignments')
    } else {
      // Convert bookings to assignment format for compatibility
      const assignmentData = (bookings || []).map(booking => ({
        id: `assignment_${booking.id}`,
        booking_id: booking.id,
        worker_id: worker?.id || '',
        assigned_at: booking.updated_at,
        status: booking.status as any,
        bookings: booking
      }))
      setAssignments(assignmentData)
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

  // Show location error notifications
  useEffect(() => {
    if (locationError) {
      console.error('Location tracking error:', locationError)
    }
  }, [locationError])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
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

  // Use mobile dashboard on smaller screens or when forced
  if (isMobile || forceMobile) {
    return <MobileWorkerDashboard />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Worker Dashboard</h1>
              <p className="text-gray-600">Welcome, {profile?.full_name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-3 py-2 rounded-full text-sm font-medium bg-${currentStatus.color}-100 text-${currentStatus.color}-800`}>
                <currentStatus.icon className="h-4 w-4 mr-2" />
                {currentStatus.label}
              </div>
              
              {/* Location tracking status */}
              <div className={`flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                isTracking 
                  ? 'bg-green-100 text-green-800' 
                  : locationError 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <SignalIcon className="h-4 w-4 mr-2" />
                {isTracking ? 'GPS Active' : locationError ? 'GPS Error' : 'GPS Off'}
              </div>

              {/* Mobile view toggle */}
              <button
                onClick={() => setForceMobile(!forceMobile)}
                className="flex items-center px-3 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                title="Switch to mobile view"
              >
                <DevicePhoneMobileIcon className="h-4 w-4 mr-2" />
                Mobile View
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Status Controls */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Status Controls</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(statusConfig).map(([status, config]) => (
              <button
                key={status}
                onClick={() => updateWorkerStatus(status as Worker['status'])}
                className={`flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  worker.status === status
                    ? `bg-${config.color}-600 text-white`
                    : `bg-${config.color}-100 text-${config.color}-800 hover:bg-${config.color}-200`
                }`}
              >
                <config.icon className="h-4 w-4 mr-2" />
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Current Assignments */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Current Jobs ({assignments.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {assignments.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No current assignments</p>
                <p className="text-sm mt-2">Set your status to "Available" to receive new jobs</p>
              </div>
            ) : (
              assignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onUpdateStatus={updateAssignmentStatus}
                />
              ))
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Jobs Today</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hours Worked</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <MapPinIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Location Status</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isTracking ? 'Active' : 'Inactive'}
                </p>
                {lastUpdate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last update: {new Date(lastUpdate).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AssignmentCard({ 
  assignment, 
  onUpdateStatus 
}: { 
  assignment: Assignment & { bookings: Booking & { profiles?: { full_name: string; phone?: string } } }
  onUpdateStatus: (bookingId: string, status: Booking['status']) => void 
}) {
  const [showPhotos, setShowPhotos] = useState(false)
  const booking = assignment.bookings

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'assigned': return 'en_route'
      case 'en_route': return 'in_progress'
      case 'in_progress': return 'completed'
      default: return null
    }
  }

  const nextStatus = getNextStatus(booking.status)
  const canTakePhotos = booking.status === 'in_progress' || booking.status === 'completed'

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-3">
            <h3 className="text-lg font-medium text-gray-900">
              {booking.service_type.replace('_', ' ').toUpperCase()} Cleaning
            </h3>
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              ${booking.price}
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPinIcon className="h-4 w-4 mr-2" />
              {booking.address}
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-2" />
              {booking.scheduled_date} at {booking.scheduled_time}
            </div>
            <div className="flex items-center">
              <PhoneIcon className="h-4 w-4 mr-2" />
              {booking.profiles?.full_name} 
              {booking.profiles?.phone && ` - ${booking.profiles.phone}`}
            </div>
          </div>

          {booking.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                <strong>Notes:</strong> {booking.notes}
              </p>
            </div>
          )}
        </div>

        <div className="ml-6 space-y-2">
          {nextStatus && (
            <button
              onClick={() => onUpdateStatus(booking.id, nextStatus as Booking['status'])}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
            >
              {nextStatus === 'en_route' && 'Start Trip'}
              {nextStatus === 'in_progress' && 'Arrive'}
              {nextStatus === 'completed' && 'Complete Job'}
            </button>
          )}
          
          <button
            onClick={() => {
              const address = encodeURIComponent(booking.address)
              window.open(`https://maps.google.com/maps?q=${address}`, '_blank')
            }}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            <ArrowRightIcon className="inline h-4 w-4 mr-1" />
            Navigate
          </button>

          {canTakePhotos && (
            <button
              onClick={() => setShowPhotos(!showPhotos)}
              className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
            >
              📷 Photos
            </button>
          )}
        </div>
      </div>

      {/* Photo Upload Section */}
      {showPhotos && canTakePhotos && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {booking.status === 'in_progress' && (
              <PhotoUploader
                bookingId={booking.id}
                workerId={assignment.worker_id}
                type="before"
                maxPhotos={3}
              />
            )}
            <PhotoUploader
              bookingId={booking.id}
              workerId={assignment.worker_id}
              type={booking.status === 'completed' ? 'after' : 'progress'}
              maxPhotos={3}
            />
          </div>
        </div>
      )}
    </div>
  )
}
