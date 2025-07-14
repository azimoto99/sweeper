import { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNotify } from '../../hooks/useNotify'
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  action_url?: string
  booking_id?: string
  created_at: string
  updated_at: string
}

export interface NotificationCenterProps {
  notifications?: Notification[]
  onClose: () => void
  onRefresh: () => Promise<void>
  isOpen?: boolean
  className?: string
}

export function NotificationCenter({ isOpen, onClose, className = '' }: NotificationCenterProps) {
  const { profile } = useAuthContext()
  const notify = useNotify()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [showingAll, setShowingAll] = useState(false)

  useEffect(() => {
    if (isOpen && profile) {
      fetchNotifications()
      
      // Set up real-time subscription for new notifications
      const subscription = supabase
        .channel('user_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        }, (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [isOpen, profile])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(showingAll ? 100 : 20)

      if (error) throw error
      
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      notify.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .in('id', notificationIds)

      if (error) throw error

      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      )
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      notify.error('Failed to mark notifications as read')
    }
  }

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds)

      if (error) throw error

      setNotifications(prev =>
        prev.filter(notification => !notificationIds.includes(notification.id))
      )
      
      setSelectedNotifications([])
      notify.success(`${notificationIds.length} notification(s) deleted`)
    } catch (error) {
      console.error('Error deleting notifications:', error)
      notify.error('Failed to delete notifications')
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds)
    }
  }

  const deleteAll = async () => {
    const allIds = notifications.map(n => n.id)
    if (allIds.length > 0) {
      await deleteNotifications(allIds)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead([notification.id])
    }

    if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return date.toLocaleDateString()
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-50 lg:absolute lg:inset-auto lg:right-0 lg:top-12 lg:w-96 ${className}`}>
      <div className="absolute inset-0 bg-black bg-opacity-50 lg:hidden" onClick={onClose} />
      
      <div className="relative bg-white shadow-xl lg:rounded-lg lg:border border-gray-200 h-full lg:h-auto lg:max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center">
            <BellIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {selectedNotifications.length > 0 && (
                  <button
                    onClick={() => deleteNotifications(selectedNotifications)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Delete ({selectedNotifications.length})
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Mark all read
                </button>
                <button
                  onClick={deleteAll}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BellIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p>No notifications yet</p>
              <p className="text-sm mt-2">You'll receive notifications here when things happen</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => handleSelectNotification(notification.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium ${
                          notification.read ? 'text-gray-900' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center mt-2">
                        <ClockIcon className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && !showingAll && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setShowingAll(true)}
              className="w-full text-center text-sm text-primary-600 hover:text-primary-700"
            >
              Show more notifications
            </button>
          </div>
        )}
      </div>
    </div>
  )
}