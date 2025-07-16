import React, { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import { Button } from '../ui/Button'
import { LoadingIndicator } from '../layout/LoadingIndicator'
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  XMarkIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { handleError, showSuccess } from '../../utils/errorHandler'

interface NotificationCenterProps {
  notifications?: any[]
  onClose?: () => void
  onRefresh?: () => Promise<void>
}

export function NotificationCenter({ notifications: propsNotifications, onClose, onRefresh }: NotificationCenterProps = {}) {
  const { notifications: hookNotifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const notifications = propsNotifications || hookNotifications
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />
    }
  }

  if (loading) {
    return (
      <div className="p-2">
        <LoadingIndicator size="sm" />
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-readable">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <BellIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No notifications yet</p>
                <p className="text-sm mt-1">When you get notifications, they'll show up here</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  getIcon={getNotificationIcon}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  getIcon 
}: {
  notification: any
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  getIcon: (type: string) => React.ReactNode
}) {
  const handleMarkAsRead = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(notification.id)
  }

  return (
    <div
      onClick={handleMarkAsRead}
      className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {getIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${
                !notification.read ? 'text-readable' : 'text-readable-muted'
              }`}>
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${
                !notification.read ? 'text-readable-muted' : 'text-gray-500'
              }`}>
                {notification.message}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>
            
            <div className="flex items-center space-x-1 ml-2">
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
              <button
                onClick={handleDelete}
                className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to create notifications
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) => {
  const { supabase } = await import('../../lib/supabase')
  
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title,
        message,
        type,
        read: false
      }])

    if (error) throw error
  } catch (error) {
    handleError(error, { action: 'create_notification', userId })
  }
}