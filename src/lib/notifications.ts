import { supabase } from './supabase'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  created_at: string
}

export async function sendSystemNotification(
  userIds: string[],
  title: string,
  message: string,
  type: NotificationType = 'info'
) {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type,
      read: false,
      created_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('notifications')
      .insert(notifications)

    if (error) throw error

    // TODO: Send push notifications, SMS, or email via Edge Functions
    // This would integrate with Twilio/Resend services

    return { success: true }
  } catch (error) {
    console.error('Error sending notification:', error)
    return { success: false, error }
  }
}

// Alias for backward compatibility
export const sendStatusUpdateNotification = sendSystemNotification
export const sendBookingNotification = sendSystemNotification

export async function getUserNotifications(userId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return { success: false, error }
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return { success: false, error }
  }
}
