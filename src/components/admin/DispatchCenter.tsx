import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Worker, Booking, Assignment } from '../../types'
import { useNotify } from '../../hooks/useNotify'
import { useBookingNotifications } from '../../hooks/useBookingNotifications'
import { sendStatusUpdateNotification } from '../../lib/notifications'
import { MapContainer } from '../map/MapContainer'
import { RouteInfo } from './RouteInfo'
import { AddressValidationStatus } from '../forms/AddressValidator'
import {
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  MapIcon,
  ListBulletIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'

export function DispatchCenter() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [showTraffic, setShowTraffic] = useState(false)
  const [showServiceArea, setShowServiceArea] = useState(true)
  const [showRoutes, setShowRoutes] = useState(false)
  const [optimizeRoutes, setOptimizeRoutes] = useState(true)
  const [mapCenter, setMapCenter] = useState<[number, number]>([27.5306, -99.4803])
  const [mapZoom, setMapZoom] = useState(12)
  const notify = useNotify()

  // Enable booking notifications for admins
  useBookingNotifications({
    enabled: true,
    playSound: true,
    showDesktopNotifications: true
  })

  useEffect(() => {
    fetchData()
    
    // Set up real-time subscriptions
    const bookingsSubscription = supabase
      .channel('bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings()
      })
      .subscribe()

    const workersSubscription = supabase
      .channel('workers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, () => {
        fetchWorkers()
      })
      .subscribe()

    const locationSubscription = supabase
      .channel('worker_locations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'worker_locations' }, () => {
        fetchWorkers() // Refresh workers when location updates
      })
      .subscribe()

    return () => {
      bookingsSubscription.unsubscribe()
      workersSubscription.unsubscribe()
      locationSubscription.unsubscribe()
    }
  }, [])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchBookings(), fetchWorkers()])
    setLoading(false)
  }

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles!bookings_user_id_fkey(full_name, phone)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
      notify.error('Failed to fetch bookings')
    } else {
      setBookings(data || [])
    }
  }

  const fetchWorkers = async () => {
    const { data, error } = await supabase
      .from('workers')
      .select(`
        *,
        profiles!workers_profile_id_fkey(full_name, phone, email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching workers:', error)
      notify.error('Failed to fetch workers')
    } else {
      // Transform data to match expected format
      const transformedWorkers = (data || []).map(worker => ({
        ...worker,
        current_location: worker.current_location_lat && worker.current_location_lng 
          ? { lat: worker.current_location_lat, lng: worker.current_location_lng }
          : null
      }))
      setWorkers(transformedWorkers)
    }
  }

  const assignWorkerToBooking = async (bookingId: string, workerId: string) => {
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

      // Update worker's assigned bookings count
      const { error: workerError } = await supabase
        .from('workers')
        .update({ 
          assigned_bookings_count: workers.find(w => w.id === workerId)?.assigned_bookings_count + 1 || 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', workerId)

      if (workerError) throw workerError

      notify.success('Worker assigned successfully!')
      fetchData()
    } catch (error) {
      console.error('Error assigning worker:', error)
      notify.error('Failed to assign worker')
    }
  }

  const handleWorkerDrop = (worker: Worker, booking: Booking) => {
    if (booking.status === 'pending') {
      assignWorkerToBooking(booking.id, worker.id)
    }
  }

  const handleWorkerClick = (worker: Worker) => {
    setSelectedWorker(selectedWorker?.id === worker.id ? null : worker)
    if (worker.current_location) {
      setMapCenter([worker.current_location.lat, worker.current_location.lng])
      setMapZoom(15)
    }
  }

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(selectedBooking?.id === booking.id ? null : booking)
    if (booking.location_lat && booking.location_lng) {
      setMapCenter([booking.location_lat, booking.location_lng])
      setMapZoom(15)
    }
  }

  const updateBookingStatus = async (bookingId: string, status: Booking['status']) => {
    try {
      // Get the current booking to send notifications
      const { data: currentBooking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

      if (fetchError) throw fetchError

      const oldStatus = currentBooking.status

      const { error } = await supabase
        .from('bookings')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) throw error

      // Send notification about status change
      await sendStatusUpdateNotification(currentBooking, oldStatus, status)

      notify.success('Booking status updated!')
      fetchData()
    } catch (error) {
      console.error('Error updating booking status:', error)
      notify.error('Failed to update booking status')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-4 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="bg-white p-4 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending')
  const assignedBookings = bookings.filter(b => b.status !== 'pending')
  const availableWorkers = workers.filter(w => w.status === 'available')

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dispatch Center</h1>
            <p className="text-gray-600">Manage bookings and assign workers</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'map' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MapIcon className="h-4 w-4 mr-1" />
                Map
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ListBulletIcon className="h-4 w-4 mr-1" />
                List
              </button>
            </div>

            {/* Map Controls */}
            {viewMode === 'map' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowTraffic(!showTraffic)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    showTraffic 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  Traffic
                </button>
                <button
                  onClick={() => setShowServiceArea(!showServiceArea)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    showServiceArea 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <GlobeAltIcon className="h-4 w-4 mr-1" />
                  Service Area
                </button>
                <button
                  onClick={() => setShowRoutes(!showRoutes)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    showRoutes 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  Routes
                </button>
                {showRoutes && (
                  <button
                    onClick={() => setOptimizeRoutes(!optimizeRoutes)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      optimizeRoutes 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Optimize
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Live Map</h2>
                    <p className="text-sm text-gray-600">
                      Drag bookings onto worker markers to assign • Click markers to zoom in
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      {workers.filter(w => w.current_location && w.last_location_update && 
                        new Date().getTime() - new Date(w.last_location_update).getTime() < 120000).length} Online
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      {pendingBookings.length} Pending
                    </div>
                    {showRoutes && selectedWorker && (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        Routes Active
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <MapContainer
                workers={workers}
                bookings={bookings}
                center={mapCenter}
                zoom={mapZoom}
                className="w-full h-96"
                onWorkerClick={handleWorkerClick}
                onBookingClick={handleBookingClick}
                onWorkerDrop={handleWorkerDrop}
                selectedWorker={selectedWorker}
                selectedBooking={selectedBooking}
                showServiceArea={showServiceArea}
                showTraffic={showTraffic}
                showRoutes={showRoutes}
                optimizeRoutes={optimizeRoutes}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <DraggableBookingsList 
              bookings={pendingBookings} 
              title="Pending Bookings"
              onSelect={handleBookingClick}
              selectedBooking={selectedBooking}
            />
            
            <WorkersList 
              workers={availableWorkers} 
              title="Available Workers"
              onSelect={handleWorkerClick}
              selectedWorker={selectedWorker}
            />

            {/* Route Information */}
            {selectedWorker && showRoutes && (
              <RouteInfo 
                worker={selectedWorker}
                bookings={bookings}
                optimizeRoutes={optimizeRoutes}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bookings Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Bookings */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Pending Bookings ({pendingBookings.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {pendingBookings.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No pending bookings</p>
                  </div>
                ) : (
                  pendingBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      workers={availableWorkers}
                      onAssignWorker={assignWorkerToBooking}
                      onUpdateStatus={updateBookingStatus}
                      onSelect={() => setSelectedBooking(booking)}
                      isSelected={selectedBooking?.id === booking.id}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Assigned Bookings */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Assigned Bookings ({assignedBookings.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {assignedBookings.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <p>No assigned bookings</p>
                  </div>
                ) : (
                  assignedBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      workers={workers}
                      onAssignWorker={assignWorkerToBooking}
                      onUpdateStatus={updateBookingStatus}
                      onSelect={() => setSelectedBooking(booking)}
                      isSelected={selectedBooking?.id === booking.id}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Workers Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Available Workers ({availableWorkers.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {availableWorkers.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <UserIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No available workers</p>
                  </div>
                ) : (
                  availableWorkers.map((worker) => (
                    <WorkerCard key={worker.id} worker={worker} />
                  ))
                )}
              </div>
            </div>

            {/* All Workers */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  All Workers ({workers.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {workers.map((worker) => (
                  <WorkerCard key={worker.id} worker={worker} showStatus />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// New draggable bookings list component
function DraggableBookingsList({ 
  bookings, 
  title, 
  onSelect, 
  selectedBooking 
}: {
  bookings: Booking[]
  title: string
  onSelect: (booking: Booking) => void
  selectedBooking: Booking | null
}) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {title} ({bookings.length})
        </h2>
        <p className="text-sm text-gray-600">Drag to assign to workers</p>
      </div>
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {bookings.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No {title.toLowerCase()}</p>
          </div>
        ) : (
          bookings.map((booking) => (
            <DraggableBookingCard
              key={booking.id}
              booking={booking}
              onSelect={() => onSelect(booking)}
              isSelected={selectedBooking?.id === booking.id}
            />
          ))
        )}
      </div>
    </div>
  )
}

// New workers list component
function WorkersList({ 
  workers, 
  title, 
  onSelect, 
  selectedWorker 
}: {
  workers: Worker[]
  title: string
  onSelect: (worker: Worker) => void
  selectedWorker: Worker | null
}) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {title} ({workers.length})
        </h2>
      </div>
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {workers.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No {title.toLowerCase()}</p>
          </div>
        ) : (
          workers.map((worker) => (
            <ClickableWorkerCard
              key={worker.id}
              worker={worker}
              onSelect={() => onSelect(worker)}
              isSelected={selectedWorker?.id === worker.id}
            />
          ))
        )}
      </div>
    </div>
  )
}

// New draggable booking card component
function DraggableBookingCard({ 
  booking, 
  onSelect, 
  isSelected 
}: {
  booking: Booking & { profiles?: { full_name: string; phone?: string } }
  onSelect: () => void
  isSelected: boolean
}) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    en_route: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(booking))
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div 
      className={`p-4 hover:bg-gray-50 cursor-move ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={onSelect}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-medium text-gray-900">
              {booking.service_type.replace('_', ' ').toUpperCase()} - ${booking.price}
            </h3>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[booking.status]}`}>
              {booking.status.replace('_', ' ')}
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 mr-2" />
              {booking.profiles?.full_name || 'Unknown Customer'}
            </div>
            <div className="flex items-center">
              <MapPinIcon className="h-4 w-4 mr-2" />
              <span className="flex-1">{booking.address}</span>
              <AddressValidationStatus address={booking.address} className="ml-2" />
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-2" />
              {booking.scheduled_date} at {booking.scheduled_time}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// New clickable worker card component
function ClickableWorkerCard({ 
  worker, 
  onSelect,
  isSelected 
}: {
  worker: Worker & { profiles?: { full_name: string; phone?: string; email?: string } }
  onSelect: () => void
  isSelected: boolean
}) {
  const statusColors = {
    available: 'bg-green-100 text-green-800',
    en_route: 'bg-blue-100 text-blue-800',
    on_job: 'bg-purple-100 text-purple-800',
    break: 'bg-yellow-100 text-yellow-800',
    offline: 'bg-gray-100 text-gray-800'
  }

  const getLocationUpdateTime = () => {
    if (!worker.last_location_update) return 'Never'
    
    const updateTime = new Date(worker.last_location_update)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - updateTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return updateTime.toLocaleDateString()
  }

  return (
    <div 
      className={`p-4 hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            {(worker as any).profiles?.full_name || 'Unknown Worker'}
          </h3>
          <div className="text-xs text-gray-600 space-y-1">
            {(worker as any).profiles?.phone && (
              <div className="flex items-center">
                <PhoneIcon className="h-3 w-3 mr-1" />
                {(worker as any).profiles.phone}
              </div>
            )}
            <div>Assigned: {worker.assigned_bookings_count} jobs</div>
            <div className="flex items-center">
              <MapPinIcon className="h-3 w-3 mr-1" />
              {worker.current_location ? (
                <span className="text-green-600">
                  Location: {getLocationUpdateTime()}
                </span>
              ) : (
                <span className="text-gray-400">No location</span>
              )}
            </div>
          </div>
        </div>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[worker.status]}`}>
          {worker.status.replace('_', ' ')}
        </span>
      </div>
    </div>
  )
}

function BookingCard({ 
  booking, 
  workers, 
  onAssignWorker, 
  onUpdateStatus, 
  onSelect, 
  isSelected 
}: {
  booking: Booking & { profiles?: { full_name: string; phone?: string } }
  workers: Worker[]
  onAssignWorker: (bookingId: string, workerId: string) => void
  onUpdateStatus: (bookingId: string, status: Booking['status']) => void
  onSelect: () => void
  isSelected: boolean
}) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    en_route: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  const assignedWorker = workers.find(w => w.id === booking.worker_id)

  return (
    <div className={`p-4 hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`} onClick={onSelect}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-medium text-gray-900">
              {booking.service_type.replace('_', ' ').toUpperCase()} - ${booking.price}
            </h3>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[booking.status]}`}>
              {booking.status.replace('_', ' ')}
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 mr-2" />
              {booking.profiles?.full_name || 'Unknown Customer'}
              {booking.profiles?.phone && (
                <span className="ml-2">({booking.profiles.phone})</span>
              )}
            </div>
            <div className="flex items-center">
              <MapPinIcon className="h-4 w-4 mr-2" />
              <span className="flex-1">{booking.address}</span>
              <AddressValidationStatus address={booking.address} className="ml-2" />
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-2" />
              {booking.scheduled_date} at {booking.scheduled_time}
            </div>
          </div>

          {assignedWorker && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
              <strong>Assigned to:</strong> {(assignedWorker as any).profiles?.full_name || 'Unknown Worker'}
            </div>
          )}
        </div>

        <div className="ml-4 space-y-2">
          {booking.status === 'pending' && (
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onAssignWorker(booking.id, e.target.value)
                }
              }}
              className="text-xs border border-gray-300 rounded px-2 py-1"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">Assign Worker</option>
              {workers.filter(w => w.status === 'available').map(worker => (
                <option key={worker.id} value={worker.id}>
                  {(worker as any).profiles?.full_name || 'Unknown Worker'}
                </option>
              ))}
            </select>
          )}
          
          {booking.status !== 'pending' && booking.status !== 'completed' && booking.status !== 'cancelled' && (
            <select
              value={booking.status}
              onChange={(e) => onUpdateStatus(booking.id, e.target.value as Booking['status'])}
              className="text-xs border border-gray-300 rounded px-2 py-1"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="assigned">Assigned</option>
              <option value="en_route">En Route</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}
        </div>
      </div>
    </div>
  )
}

function WorkerCard({ 
  worker, 
  showStatus = false 
}: { 
  worker: Worker & { profiles?: { full_name: string; phone?: string; email?: string } }
  showStatus?: boolean 
}) {
  const statusColors = {
    available: 'bg-green-100 text-green-800',
    en_route: 'bg-blue-100 text-blue-800',
    on_job: 'bg-purple-100 text-purple-800',
    break: 'bg-yellow-100 text-yellow-800',
    offline: 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            {(worker as any).profiles?.full_name || 'Unknown Worker'}
          </h3>
          <div className="text-xs text-gray-600 space-y-1">
            {(worker as any).profiles?.phone && (
              <div className="flex items-center">
                <PhoneIcon className="h-3 w-3 mr-1" />
                {(worker as any).profiles.phone}
              </div>
            )}
            <div>Assigned: {worker.assigned_bookings_count} jobs</div>
          </div>
        </div>
        {showStatus && (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[worker.status]}`}>
            {worker.status.replace('_', ' ')}
          </span>
        )}
      </div>
    </div>
  )
}