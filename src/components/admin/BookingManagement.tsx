import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Booking, Worker } from '../../types'
import { useNotify } from '../../hooks/useNotify'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

interface BookingWithProfiles extends Booking {
  profiles?: {
    full_name: string
    email: string
    phone?: string
  }
  workers?: {
    profiles?: {
      full_name: string
    }
  }
}

export function BookingManagement() {
  const [bookings, setBookings] = useState<BookingWithProfiles[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Booking['status']>('all')
  const [selectedBooking, setSelectedBooking] = useState<BookingWithProfiles | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const notify = useNotify()

  useEffect(() => {
    fetchBookings()
    fetchWorkers()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('booking_management')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, () => {
        fetchBookings()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles!bookings_user_id_fkey(full_name, email, phone),
          workers!bookings_worker_id_fkey(
            profiles!workers_profile_id_fkey(full_name)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
      notify.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from('workers')
        .select(`
          *,
          profiles!workers_profile_id_fkey(full_name)
        `)
        .eq('status', 'available')

      if (error) throw error
      setWorkers(data || [])
    } catch (error) {
      console.error('Error fetching workers:', error)
    }
  }

  const updateBookingStatus = async (bookingId: string, status: Booking['status']) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) throw error

      notify.success(`Booking status updated to ${status.replace('_', ' ')}`)
      fetchBookings()
    } catch (error) {
      console.error('Error updating booking status:', error)
      notify.error('Failed to update booking status')
    }
  }

  const assignWorker = async (bookingId: string, workerId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          worker_id: workerId,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) throw error

      notify.success('Worker assigned successfully')
      setShowAssignModal(false)
      setSelectedBooking(null)
      fetchBookings()
    } catch (error) {
      console.error('Error assigning worker:', error)
      notify.error('Failed to assign worker')
    }
  }

  const deleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)

      if (error) throw error

      notify.success('Booking deleted successfully')
      fetchBookings()
    } catch (error) {
      console.error('Error deleting booking:', error)
      notify.error('Failed to delete booking')
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.address.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'assigned':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-indigo-100 text-indigo-800'
      case 'en_route':
        return 'bg-purple-100 text-purple-800'
      case 'in_progress':
        return 'bg-orange-100 text-orange-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4" />
      case 'assigned':
      case 'confirmed':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'en_route':
        return <ArrowRightIcon className="h-4 w-4" />
      case 'in_progress':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
            <p className="text-gray-600">Manage customer bookings and assignments</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {filteredBookings.length} of {bookings.length} bookings
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="confirmed">Confirmed</option>
            <option value="en_route">En Route</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            onAssign={() => {
              setSelectedBooking(booking)
              setShowAssignModal(true)
            }}
            onViewDetails={() => {
              setSelectedBooking(booking)
              setShowDetailsModal(true)
            }}
            onUpdateStatus={updateBookingStatus}
            onDelete={deleteBooking}
          />
        ))}
      </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No bookings found</p>
          <p className="text-sm text-gray-400 mt-2">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Bookings will appear here as customers make them'
            }
          </p>
        </div>
      )}

      {/* Modals */}
      {showAssignModal && selectedBooking && (
        <AssignWorkerModal
          booking={selectedBooking}
          workers={workers}
          onAssign={assignWorker}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedBooking(null)
          }}
        />
      )}

      {showDetailsModal && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedBooking(null)
          }}
        />
      )}
    </div>
  )
}

function BookingCard({ 
  booking, 
  onAssign, 
  onViewDetails, 
  onUpdateStatus, 
  onDelete 
}: {
  booking: BookingWithProfiles
  onAssign: () => void
  onViewDetails: () => void
  onUpdateStatus: (id: string, status: Booking['status']) => void
  onDelete: (id: string) => void
}) {
  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'assigned':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-indigo-100 text-indigo-800'
      case 'en_route':
        return 'bg-purple-100 text-purple-800'
      case 'in_progress':
        return 'bg-orange-100 text-orange-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900">
              {booking.service_type.replace('_', ' ').toUpperCase()} Cleaning
            </h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
              {booking.status.replace('_', ' ')}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 mr-2" />
              <span>{booking.profiles?.full_name}</span>
            </div>
            <div className="flex items-center">
              <MapPinIcon className="h-4 w-4 mr-2" />
              <span className="truncate">{booking.address}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-2" />
              <span>{new Date(booking.scheduled_date).toLocaleDateString()} at {booking.scheduled_time}</span>
            </div>
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-4 w-4 mr-2" />
              <span className="font-medium">${booking.price}</span>
            </div>
          </div>

          {booking.workers?.profiles && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Assigned to:</span> {booking.workers.profiles.full_name}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={onViewDetails}
            className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View
          </button>
          
          {!booking.worker_id && booking.status === 'pending' && (
            <button
              onClick={onAssign}
              className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
            >
              <UserIcon className="h-4 w-4 mr-1" />
              Assign
            </button>
          )}
          
          {booking.status === 'pending' && (
            <button
              onClick={() => onUpdateStatus(booking.id, 'confirmed')}
              className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
            >
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Confirm
            </button>
          )}
        </div>
        
        <div className="flex space-x-2">
          {!['completed', 'cancelled'].includes(booking.status) && (
            <button
              onClick={() => onUpdateStatus(booking.id, 'cancelled')}
              className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
            >
              <XCircleIcon className="h-4 w-4 mr-1" />
              Cancel
            </button>
          )}
          
          <button
            onClick={() => onDelete(booking.id)}
            className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function AssignWorkerModal({ 
  booking, 
  workers, 
  onAssign, 
  onClose 
}: {
  booking: BookingWithProfiles
  workers: Worker[]
  onAssign: (bookingId: string, workerId: string) => void
  onClose: () => void
}) {
  const [selectedWorkerId, setSelectedWorkerId] = useState('')

  const handleAssign = () => {
    if (selectedWorkerId) {
      onAssign(booking.id, selectedWorkerId)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Assign Worker</h3>
          <p className="text-sm text-gray-600 mt-1">
            Assign a worker to {booking.profiles?.full_name}'s booking
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Worker
              </label>
              <select
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a worker</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {(worker as any).profiles?.full_name || 'Unknown Worker'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedWorkerId}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              Assign Worker
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function BookingDetailsModal({ 
  booking, 
  onClose 
}: {
  booking: BookingWithProfiles
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Booking Details</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XCircleIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Information */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <div>{booking.profiles?.full_name}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <div>{booking.profiles?.email}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <div>{booking.profiles?.phone || 'Not provided'}</div>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Service Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Service Type:</span>
                <div>{booking.service_type.replace('_', ' ').toUpperCase()}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Price:</span>
                <div>${booking.price}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Date:</span>
                <div>{new Date(booking.scheduled_date).toLocaleDateString()}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Time:</span>
                <div>{booking.scheduled_time}</div>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Address:</span>
                <div>{booking.address}</div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {booking.notes && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Special Instructions</h4>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">
                {booking.notes}
              </p>
            </div>
          )}

          {/* Status and Assignment */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Status & Assignment</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              {booking.workers?.profiles && (
                <div>
                  <span className="font-medium text-gray-700">Assigned Worker:</span>
                  <div>{booking.workers.profiles.full_name}</div>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Timestamps</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <div>{new Date(booking.created_at).toLocaleString()}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Updated:</span>
                <div>{new Date(booking.updated_at).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}