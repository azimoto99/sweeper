import React, { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { LoadingIndicator } from '../layout/LoadingIndicator'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  ClockIcon,
  MapPinIcon,
  CalendarDaysIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { handleError, showSuccess, setLoading, isLoading } from '../../utils/errorHandler'

interface ServiceConfig {
  id: string
  name: string
  service_type: string
  base_price: number
  duration: number
  price_per_mile: number
  rush_multiplier: number
  weekend_multiplier: number
  holiday_multiplier: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface AddOn {
  id: string
  name: string
  price: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export function ServiceManagement() {
  const { profile } = useAuthContext()
  const [services, setServices] = useState<ServiceConfig[]>([])
  const [addOns, setAddOns] = useState<AddOn[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [editingService, setEditingService] = useState<ServiceConfig | null>(null)
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null)
  const [showAddService, setShowAddService] = useState(false)
  const [showAddAddOn, setShowAddAddOn] = useState(false)

  useEffect(() => {
    fetchServices()
    fetchAddOns()
  }, [])

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('service_configs')
        .select('*')
        .order('service_type')

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      handleError(error, { action: 'fetch_services', userId: profile?.id })
    }
  }

  const fetchAddOns = async () => {
    try {
      const { data, error } = await supabase
        .from('service_add_ons')
        .select('*')
        .order('name')

      if (error) throw error
      setAddOns(data || [])
    } catch (error) {
      handleError(error, { action: 'fetch_add_ons', userId: profile?.id })
    } finally {
      setLoadingData(false)
    }
  }

  const handleSaveService = async (service: Partial<ServiceConfig>) => {
    try {
      if (editingService) {
        const { error } = await supabase
          .from('service_configs')
          .update({
            ...service,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingService.id)

        if (error) throw error
        showSuccess('Service updated successfully')
      } else {
        const { error } = await supabase
          .from('service_configs')
          .insert([service])

        if (error) throw error
        showSuccess('Service created successfully')
      }

      setEditingService(null)
      setShowAddService(false)
      fetchServices()
    } catch (error) {
      console.error('Error saving service:', error)
      handleError(error, { action: 'save_service', userId: profile?.id })
    }
  }

  const handleSaveAddOn = async (addOn: Partial<AddOn>) => {
    try {
      if (editingAddOn) {
        const { error } = await supabase
          .from('service_add_ons')
          .update({
            ...addOn,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAddOn.id)

        if (error) throw error
        showSuccess('Add-on updated successfully')
      } else {
        const { error } = await supabase
          .from('service_add_ons')
          .insert([addOn])

        if (error) throw error
        showSuccess('Add-on created successfully')
      }

      setEditingAddOn(null)
      setShowAddAddOn(false)
      fetchAddOns()
    } catch (error) {
      console.error('Error saving add-on:', error)
      handleError(error, { action: 'save_add_on', userId: profile?.id })
    }
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const { error } = await supabase
        .from('service_configs')
        .delete()
        .eq('id', id)

      if (error) throw error
      showSuccess('Service deleted successfully')
      fetchServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      handleError(error, { action: 'delete_service', userId: profile?.id })
    }
  }

  const handleDeleteAddOn = async (id: string) => {
    if (!confirm('Are you sure you want to delete this add-on?')) return

    try {
      const { error } = await supabase
        .from('service_add_ons')
        .delete()
        .eq('id', id)

      if (error) throw error
      showSuccess('Add-on deleted successfully')
      fetchAddOns()
    } catch (error) {
      console.error('Error deleting add-on:', error)
      handleError(error, { action: 'delete_add_on', userId: profile?.id })
    }
  }

  if (loadingData) {
    return <LoadingIndicator fullScreen size="lg" text="Loading services..." />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-readable">Service Management</h1>
          <p className="text-readable-muted mt-1">Manage cleaning services and pricing</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowAddService(true)}
            leftIcon={<PlusIcon className="h-4 w-4" />}
            variant="primary"
          >
            Add Service
          </Button>
          <Button
            onClick={() => setShowAddAddOn(true)}
            leftIcon={<PlusIcon className="h-4 w-4" />}
            variant="secondary"
          >
            Add Add-on
          </Button>
        </div>
      </div>

      {/* Services Section */}
      <div className="card-elevated">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-readable flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 mr-2 text-emerald-500" />
            Cleaning Services
          </h2>
          <p className="text-readable-muted mt-1">Configure service types and pricing</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() => setEditingService(service)}
                onDelete={() => handleDeleteService(service.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Add-ons Section */}
      <div className="card-elevated">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-readable flex items-center">
            <PlusIcon className="h-5 w-5 mr-2 text-blue-500" />
            Service Add-ons
          </h2>
          <p className="text-readable-muted mt-1">Optional extras customers can add to their service</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {addOns.map((addOn) => (
              <AddOnCard
                key={addOn.id}
                addOn={addOn}
                onEdit={() => setEditingAddOn(addOn)}
                onDelete={() => handleDeleteAddOn(addOn.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {(showAddService || editingService) && (
        <ServiceModal
          service={editingService}
          onSave={handleSaveService}
          onCancel={() => {
            setEditingService(null)
            setShowAddService(false)
          }}
        />
      )}

      {(showAddAddOn || editingAddOn) && (
        <AddOnModal
          addOn={editingAddOn}
          onSave={handleSaveAddOn}
          onCancel={() => {
            setEditingAddOn(null)
            setShowAddAddOn(false)
          }}
        />
      )}
    </div>
  )
}

function ServiceCard({ service, onEdit, onDelete }: {
  service: ServiceConfig
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="card border-l-4 border-l-emerald-500 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-readable capitalize">
            {service.name || service.service_type.replace('_', ' ')}
          </h3>
          <p className="text-sm text-readable-muted mt-1">{service.description}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 hover:text-red-800 transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center text-readable-muted">
          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
          ${service.base_price}
        </div>
        <div className="flex items-center text-readable-muted">
          <ClockIcon className="h-4 w-4 mr-1" />
          {service.duration}h
        </div>
        <div className="flex items-center text-readable-muted">
          <MapPinIcon className="h-4 w-4 mr-1" />
          ${service.price_per_mile}/mi
        </div>
        <div className="flex items-center text-readable-muted">
          <CalendarDaysIcon className="h-4 w-4 mr-1" />
          {service.weekend_multiplier}x weekend
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          service.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {service.is_active ? 'Active' : 'Inactive'}
        </span>
        <div className="text-xs text-readable-muted">
          Rush: {service.rush_multiplier}x | Holiday: {service.holiday_multiplier}x
        </div>
      </div>
    </div>
  )
}

function AddOnCard({ addOn, onEdit, onDelete }: {
  addOn: AddOn
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="card border-l-4 border-l-blue-500 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-readable">{addOn.name}</h3>
          <p className="text-sm text-readable-muted mt-1">{addOn.description}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 hover:text-red-800 transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center text-readable-muted">
          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
          ${addOn.price}
        </div>
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          addOn.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {addOn.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  )
}

function ServiceModal({ service, onSave, onCancel }: {
  service: ServiceConfig | null
  onSave: (service: Partial<ServiceConfig>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    service_type: service?.service_type || '',
    base_price: service?.base_price || 0,
    duration: service?.duration || 0,
    price_per_mile: service?.price_per_mile || 0,
    rush_multiplier: service?.rush_multiplier || 1,
    weekend_multiplier: service?.weekend_multiplier || 1,
    holiday_multiplier: service?.holiday_multiplier || 1,
    description: service?.description || '',
    is_active: service?.is_active ?? true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card-elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-readable">
            {service ? 'Edit Service' : 'Add New Service'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-readable mb-1">
                Service Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-readable mb-1">
                Service Type
              </label>
              <select
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="input"
                required
              >
                <option value="">Select type</option>
                <option value="regular">Regular</option>
                <option value="deep">Deep</option>
                <option value="move_in_out">Move In/Out</option>
                <option value="airbnb">Airbnb</option>
                <option value="office">Office</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-readable mb-1">
                Base Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-readable mb-1">
                Duration (hours)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-readable mb-1">
                Price per Mile ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price_per_mile}
                onChange={(e) => setFormData({ ...formData, price_per_mile: parseFloat(e.target.value) })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-readable mb-1">
                Rush Hour Multiplier
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.rush_multiplier}
                onChange={(e) => setFormData({ ...formData, rush_multiplier: parseFloat(e.target.value) })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-readable mb-1">
                Weekend Multiplier
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.weekend_multiplier}
                onChange={(e) => setFormData({ ...formData, weekend_multiplier: parseFloat(e.target.value) })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-readable mb-1">
                Holiday Multiplier
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.holiday_multiplier}
                onChange={(e) => setFormData({ ...formData, holiday_multiplier: parseFloat(e.target.value) })}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-readable mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-readable">
              Active (available for booking)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={onCancel}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              {service ? 'Update' : 'Create'} Service
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddOnModal({ addOn, onSave, onCancel }: {
  addOn: AddOn | null
  onSave: (addOn: Partial<AddOn>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: addOn?.name || '',
    price: addOn?.price || 0,
    description: addOn?.description || '',
    is_active: addOn?.is_active ?? true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card-elevated max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-readable">
            {addOn ? 'Edit Add-on' : 'Add New Add-on'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-readable mb-1">
              Add-on Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-readable mb-1">
              Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-readable mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-readable">
              Active (available for selection)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={onCancel}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              {addOn ? 'Update' : 'Create'} Add-on
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}