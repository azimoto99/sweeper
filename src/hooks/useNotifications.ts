import { useState, useEffect } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { handleError } from '../utils/errorHandler'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
}

export function useNotifications() {
  const { user } = useAuthContext()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    fetchNotifications()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newNotification = payload.new as Notification
        setNotifications(prev => [newNotification, ...prev])
        setUnreadCount(prev => prev + 1)
        
        // Show toast notification
        showToastNotification(newNotification)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const updatedNotification = payload.new as Notification
        setNotifications(prev => 
          prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
        )
        updateUnreadCount()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.read).length || 0)
    } catch (error) {
      handleError(error, { action: 'fetch_notifications', userId: user.id })
    } finally {
      setLoading(false)
    }
  }

  const updateUnreadCount = async () => {
    if (!user) return

    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)

      setUnreadCount(count || 0)
    } catch (error) {
      handleError(error, { action: 'update_unread_count', userId: user.id })
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      handleError(error, { action: 'mark_notification_read', userId: user?.id })
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      handleError(error, { action: 'mark_all_notifications_read', userId: user.id })
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      updateUnreadCount()
    } catch (error) {
      handleError(error, { action: 'delete_notification', userId: user?.id })
    }
  }

  const showToastNotification = (notification: Notification) => {
    const toastOptions = {
      duration: 5000,
      position: 'top-right' as const,
    }

    switch (notification.type) {
      case 'success':
        toast.success(`${notification.title}\n${notification.message}`, toastOptions)
        break
      case 'error':
        toast.error(`${notification.title}\n${notification.message}`, toastOptions)
        break
      case 'warning':
        toast(`${notification.title}\n${notification.message}`, {
          ...toastOptions,
          icon: '⚠️'
        })
        break
      default:
        toast(`${notification.title}\n${notification.message}`, toastOptions)
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications
  }
}