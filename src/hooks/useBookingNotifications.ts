import { useEffect } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { sendSystemNotification } from '../lib/notifications'
import toast from 'react-hot-toast'

export function useBookingNotifications() {
  const { profile } = useAuthContext()

  useEffect(() => {
    if (!profile?.id) return

    // Subscribe to booking changes for this user
    const subscription = supabase
      .channel('booking-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `user_id=eq.${profile.id}`
      }, (payload) => {
        handleBookingChange(payload)
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [profile?.id])

  const handleBookingChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        toast.success('Booking created successfully!')
        break
      
      case 'UPDATE':
        if (oldRecord.status !== newRecord.status) {
          handleStatusChange(newRecord.status, newRecord)
        }
        break
      
      case 'DELETE':
        toast('Booking cancelled', {
          icon: 'ℹ️',
        })
        break
    }
  }

  const handleStatusChange = (newStatus: string, booking: any) => {
    const statusMessages = {
      'assigned': 'A cleaner has been assigned to your booking!',
      'en_route': 'Your cleaner is on their way!',
      'in_progress': 'Your cleaning service has started.',
      'completed': 'Your cleaning service has been completed!',
      'cancelled': 'Your booking has been cancelled.'
    }

    const message = statusMessages[newStatus as keyof typeof statusMessages]
    if (message) {
      toast.success(message)
      
      // Send system notification
      sendSystemNotification(
        [booking.user_id],
        'Booking Update',
        message,
        newStatus === 'cancelled' ? 'warning' : 'success'
      )
    }
  }

  const notifyWorkerAssignment = async (bookingId: string, workerId: string) => {
    try {
      await sendSystemNotification(
        [workerId],
        'New Job Assignment',
        'You have been assigned a new cleaning job. Please check your dashboard for details.',
        'info'
      )
    } catch (error) {
      console.error('Error sending worker notification:', error)
    }
  }

  const notifyBookingReminder = async (bookingId: string, userId: string, scheduledTime: string) => {
    try {
      await sendSystemNotification(
        [userId],
        'Service Reminder',
        `Your cleaning service is scheduled for ${scheduledTime}. Your cleaner will arrive soon!`,
        'info'
      )
    } catch (error) {
      console.error('Error sending booking reminder:', error)
    }
  }

  return {
    notifyWorkerAssignment,
    notifyBookingReminder
  }
}
