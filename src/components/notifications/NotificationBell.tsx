import React, { useState, useEffect } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid'
import { useAuthContext } from '../../contexts/AuthContext'
import { getUserNotifications, markAllNotificationsAsRead } from '../../lib/notifications'
import { NotificationCenter } from './NotificationCenter'

export function NotificationBell() {
  const { profile } = useAuthContext()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile?.id) {
      fetchNotifications()
    }
  }, [profile?.id])

  const fetchNotifications = async () => {
    if (!profile?.id) return

    setLoading(true)
    try {
      const { data } = await getUserNotifications(profile.id, 10)
      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.read).length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!profile?.id) return

    try {
      await markAllNotificationsAsRead(profile.id)
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
    if (!showNotifications && unreadCount > 0) {
      handleMarkAllAsRead()
    }
  }

  return (
    <div className="relative">
      <button
        onClick={toggleNotifications}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-6 w-6" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <NotificationCenter
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
            onRefresh={fetchNotifications}
          />
        </div>
      )}
    </div>
  )
}
