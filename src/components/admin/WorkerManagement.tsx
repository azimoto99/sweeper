import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Worker } from '../../types'
import { useNotify } from '../../hooks/useNotify'
import { sendSystemNotification } from '../../lib/notifications'
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  StarIcon,
  CogIcon,
} from '@heroicons/react/24/outline'

interface WorkerWithProfile extends Worker {
  profiles?: {
    full_name: string
    email: string
    phone?: string
    created_at: string
  }
}

export function WorkerManagement() {
  const [workers, setWorkers] = useState<WorkerWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Worker['status']>('all')
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithProfile | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const notify = useNotify()

  useEffect(() => {
    fetchWorkers()
    
    // Set up real-time subscription for worker updates
    const subscription = supabase
      .channel('worker_management')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workers'
      }, () => {
        fetchWorkers()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchWorkers = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('workers')
        .select(`
          *,
          profiles!workers_profile_id_fkey(full_name, email, phone, created_at)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setWorkers(data || [])
    } catch (error) {
      console.error('Error fetching workers:', error)
      notify.error('Failed to load workers')
    } finally {
      setLoading(false)
    }
  }

  const handleAddWorker = () => {
    setSelectedWorker(null)
    setShowAddModal(true)
  }

  const handleEditWorker = (worker: WorkerWithProfile) => {
    setSelectedWorker(worker)
    setShowEditModal(true)
  }

  const handleDeleteWorker = (worker: WorkerWithProfile) => {
    setSelectedWorker(worker)
    setShowDeleteModal(true)
  }

  const handleViewDetails = (worker: WorkerWithProfile) => {
    setSelectedWorker(worker)
    setShowDetailsModal(true)
  }

  const confirmDeleteWorker = async () => {
    if (!selectedWorker) return

    try {
      // First, update any assigned bookings to unassigned
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ worker_id: null, status: 'pending' })
        .eq('worker_id', selectedWorker.id)
        .in('status', ['assigned', 'en_route'])

      if (bookingError) throw bookingError

      // Then delete the worker
      const { error: workerError } = await supabase
        .from('workers')
        .delete()
        .eq('id', selectedWorker.id)

      if (workerError) throw workerError

      // Send notification to the worker
      await sendSystemNotification(
        [selectedWorker.id],
        'Account Deactivated',
        'Your worker account has been deactivated. Please contact administration for more information.',
        'warning'
      )

      notify.success('Worker deleted successfully')
      setShowDeleteModal(false)
      setSelectedWorker(null)
      fetchWorkers()
    } catch (error) {
      console.error('Error deleting worker:', error)
      notify.error('Failed to delete worker')
    }
  }

  const updateWorkerStatus = async (workerId: string, status: Worker['status']) => {
    try {
      const { error } = await supabase
        .from('workers')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', workerId)

      if (error) throw error

      // Send notification to the worker about status change
      const worker = workers.find(w => w.id === workerId)
      if (worker) {
        await sendSystemNotification(
          [worker.id],
          'Status Updated',
          `Your worker status has been updated to ${status.replace('_', ' ')}`,
          'info'
        )
      }

      notify.success(`Worker status updated to ${status.replace('_', ' ')}`)
      fetchWorkers()
    } catch (error) {
      console.error('Error updating worker status:', error)
      notify.error('Failed to update worker status')
    }
  }

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = worker.profiles?.full_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) || 
      worker.profiles?.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || worker.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: Worker['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'en_route':
        return 'bg-blue-100 text-blue-800'
      case 'on_job':
        return 'bg-purple-100 text-purple-800'
      case 'break':
        return 'bg-yellow-100 text-yellow-800'
      case 'offline':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Worker['status']) => {
    switch (status) {
      case 'available':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'en_route':
        return <MapPinIcon className="h-4 w-4" />
      case 'on_job':
        return <CogIcon className="h-4 w-4" />
      case 'break':
        return <ClockIcon className="h-4 w-4" />
      case 'offline':
        return <XCircleIcon className="h-4 w-4" />
      default:
        return <ExclamationTriangleIcon className="h-4 w-4" />
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
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
            <h1 className="text-2xl font-bold text-gray-900">Worker Management</h1>
            <p className="text-gray-600">Manage your cleaning service workers</p>
          </div>
          <button
            onClick={handleAddWorker}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Worker
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search workers..."
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
            <option value="available">Available</option>
            <option value="en_route">En Route</option>
            <option value="on_job">On Job</option>
            <option value="break">On Break</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkers.map((worker) => (
          <WorkerCard
            key={worker.id}
            worker={worker}
            onEdit={handleEditWorker}
            onDelete={handleDeleteWorker}
            onViewDetails={handleViewDetails}
            onUpdateStatus={updateWorkerStatus}
          />
        ))}
      </div>

      {filteredWorkers.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No workers found</p>
          <p className="text-sm text-gray-400 mt-2">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Get started by adding your first worker'
            }
          </p>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddWorkerModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchWorkers()
          }}
        />
      )}

      {showEditModal && selectedWorker && (
        <EditWorkerModal
          worker={selectedWorker}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchWorkers()
          }}
        />
      )}

      {showDeleteModal && selectedWorker && (
        <DeleteWorkerModal
          worker={selectedWorker}
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteWorker}
        />
      )}

      {showDetailsModal && selectedWorker && (
        <WorkerDetailsModal
          worker={selectedWorker}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  )
}

function WorkerCard({
  worker,
  onEdit,
  onDelete,
  onViewDetails,
  onUpdateStatus
}: {
  worker: WorkerWithProfile
  onEdit: (worker: WorkerWithProfile) => void
  onDelete: (worker: WorkerWithProfile) => void
  onViewDetails: (worker: WorkerWithProfile) => void
  onUpdateStatus: (workerId: string, status: Worker['status']) => void
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const getStatusColor = (status: Worker['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'en_route':
        return 'bg-blue-100 text-blue-800'
      case 'on_job':
        return 'bg-purple-100 text-purple-800'
      case 'break':
        return 'bg-yellow-100 text-yellow-800'
      case 'offline':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Worker['status']) => {
    switch (status) {
      case 'available':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'en_route':
        return <MapPinIcon className="h-4 w-4" />
      case 'on_job':
        return <CogIcon className="h-4 w-4" />
      case 'break':
        return <ClockIcon className="h-4 w-4" />
      case 'offline':
        return <XCircleIcon className="h-4 w-4" />
      default:
        return <ExclamationTriangleIcon className="h-4 w-4" />
    }
  }

  const formatLastSeen = () => {
    if (!worker.last_location_update) return 'Never'
    
    const lastSeen = new Date(worker.last_location_update)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return lastSeen.toLocaleDateString()
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <UserGroupIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              {worker.profiles?.full_name || 'Unknown Worker'}
            </h3>
            <p className="text-sm text-gray-600">{worker.profiles?.email}</p>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(worker.status)}`}
          >
            {getStatusIcon(worker.status)}
            <span className="ml-1">{worker.status.replace('_', ' ')}</span>
          </button>
          
          {showStatusMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="py-1">
                {(['available', 'en_route', 'on_job', 'break', 'offline'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      onUpdateStatus(worker.id, status)
                      setShowStatusMenu(false)
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {getStatusIcon(status)}
                    <span className="ml-2">{status.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        {worker.profiles?.phone && (
          <div className="flex items-center">
            <PhoneIcon className="h-4 w-4 mr-2" />
            {worker.profiles.phone}
          </div>
        )}
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2" />
          Joined {new Date(worker.profiles?.created_at || '').toLocaleDateString()}
        </div>
        <div className="flex items-center">
          <MapPinIcon className="h-4 w-4 mr-2" />
          <span className={worker.current_location ? 'text-green-600' : 'text-gray-400'}>
            {worker.current_location ? `Last seen: ${formatLastSeen()}` : 'No location data'}
          </span>
        </div>
        <div className="flex items-center">
          <StarIcon className="h-4 w-4 mr-2" />
          {worker.assigned_bookings_count} assigned jobs
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => onViewDetails(worker)}
            className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View
          </button>
          <button
            onClick={() => onEdit(worker)}
            className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </button>
        </div>
        <button
          onClick={() => onDelete(worker)}
          className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
        >
          <TrashIcon className="h-4 w-4 mr-1" />
          Delete
        </button>
      </div>
    </div>
  )
}

// Modal components would be implemented here
function AddWorkerModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  // Implementation for adding new workers
  return null
}

function EditWorkerModal({ worker, isOpen, onClose, onSuccess }: { worker: WorkerWithProfile; isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  // Implementation for editing worker details
  return null
}

function DeleteWorkerModal({ worker, isOpen, onClose, onConfirm }: { worker: WorkerWithProfile; isOpen: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Delete Worker</h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete <strong>{worker.profiles?.full_name}</strong>? 
          This action cannot be undone and will unassign all their current bookings.
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Delete Worker
          </button>
        </div>
      </div>
    </div>
  )
}

function WorkerDetailsModal({ worker, isOpen, onClose }: { worker: WorkerWithProfile; isOpen: boolean; onClose: () => void }) {
  // Implementation for viewing worker details
  return null
}