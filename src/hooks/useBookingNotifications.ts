import { useEffect, useRef } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useNotify } from './useNotify'
import { Booking, Worker } from '../types'

interface BookingNotificationOptions {
  enabled?: boolean
  playSound?: boolean
  showDesktopNotifications?: boolean
}

export function useBookingNotifications(options: BookingNotificationOptions = {}) {
  const { profile } = useAuthContext()
  const notify = useNotify()
  const {
    enabled = true,
    playSound = true,
    showDesktopNotifications = true
  } = options

  const lastNotificationRef = useRef<string>('')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize notification audio
  useEffect(() => {
    if (playSound && typeof window !== 'undefined') {
      // Create a simple notification sound using Web Audio API
      const createNotificationSound = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = 800
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      }
      
      audioRef.current = { play: createNotificationSound } as any
    }
  }, [playSound])

  // Request notification permission
  useEffect(() => {
    if (showDesktopNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [showDesktopNotifications])

  // Set up real-time subscriptions based on user role
  useEffect(() => {
    if (!enabled || !profile) return

    let subscription: any

    if (profile.role === 'customer') {
      // Customer: Listen for updates to their own bookings
      subscription = supabase
        .channel('customer_booking_notifications')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${profile.id}`
        }, (payload) => {
          handleBookingUpdate(payload.new as Booking, payload.old as Booking)
        })
        .subscribe()
    } else if (profile.role === 'worker') {
      // Worker: Listen for bookings assigned to them
      subscription = supabase
        .channel('worker_booking_notifications')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `worker_id=eq.${profile.id}`
        }, (payload) => {
          handleBookingUpdate(payload.new as Booking, payload.old as Booking)
        })
        .subscribe()
    } else if (profile.role === 'admin') {
      // Admin: Listen for all booking updates
      subscription = supabase
        .channel('admin_booking_notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bookings'
        }, (payload) => {
          if (payload.eventType === 'UPDATE') {
            handleBookingUpdate(payload.new as Booking, payload.old as Booking)
          } else if (payload.eventType === 'INSERT') {
            handleNewBooking(payload.new as Booking)
          }
        })
        .subscribe()
    }

    return () => {
      subscription?.unsubscribe()
    }
  }, [enabled, profile])

  const handleBookingUpdate = (newBooking: Booking, oldBooking: Booking) => {
    if (!newBooking || !oldBooking) return

    const notificationId = `${newBooking.id}-${newBooking.status}-${Date.now()}`
    
    // Prevent duplicate notifications
    if (lastNotificationRef.current === notificationId) return
    lastNotificationRef.current = notificationId

    const statusChanged = newBooking.status !== oldBooking.status
    const workerAssigned = newBooking.worker_id && !oldBooking.worker_id

    if (statusChanged || workerAssigned) {
      const message = getStatusChangeMessage(newBooking, oldBooking, profile?.role)
      const type = getNotificationType(newBooking.status)

      // Show toast notification
      if (type === 'success') {
        notify.success(message)
      } else if (type === 'error') {
        notify.error(message)
      } else {
        notify.success(message)
      }

      // Play sound
      if (playSound && audioRef.current) {
        try {
          audioRef.current.play()
        } catch (error) {
          console.log('Could not play notification sound:', error)
        }
      }

      // Show desktop notification
      if (showDesktopNotifications && 'Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('Margarita\'s Cleaning Services', {
          body: message,
          icon: '/favicon.ico',
          tag: notificationId,
          requireInteraction: type === 'error' || newBooking.status === 'assigned'
        })

        notification.onclick = () => {
          window.focus()
          // Navigate to appropriate page based on role
          if (profile?.role === 'customer') {
            window.location.href = '/customer'
          } else if (profile?.role === 'worker') {
            window.location.href = '/worker'
          } else if (profile?.role === 'admin') {
            window.location.href = '/admin/dispatch'
          }
        }

        // Auto-close after 5 seconds for non-critical notifications
        if (type !== 'error') {
          setTimeout(() => notification.close(), 5000)
        }
      }
    }
  }

  const handleNewBooking = (booking: Booking) => {
    if (profile?.role !== 'admin') return

    const message = `New booking received: ${booking.service_type.replace('_', ' ').toUpperCase()} - $${booking.price}`
    
    notify.success(message)

    if (playSound && audioRef.current) {
      try {
        audioRef.current.play()
      } catch (error) {
        console.log('Could not play notification sound:', error)
      }
    }

    if (showDesktopNotifications && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('New Booking Alert', {
        body: message,
        icon: '/favicon.ico',
        tag: `new-booking-${booking.id}`,
        requireInteraction: true
      })

      notification.onclick = () => {
        window.focus()
        window.location.href = '/admin/dispatch'
      }
    }
  }

  const getStatusChangeMessage = (newBooking: Booking, oldBooking: Booking, role?: string): string => {
    const serviceType = newBooking.service_type.replace('_', ' ').toUpperCase()
    
    if (newBooking.worker_id && !oldBooking.worker_id) {
      if (role === 'customer') {
        return `A worker has been assigned to your ${serviceType} service`
      } else if (role === 'worker') {
        return `New job assigned: ${serviceType} - $${newBooking.price}`
      } else if (role === 'admin') {
        return `Worker assigned to booking ${newBooking.id}`
      }
    }

    switch (newBooking.status) {
      case 'assigned':
        if (role === 'customer') {
          return `Your ${serviceType} service has been assigned to a worker`
        } else if (role === 'admin') {
          return `Booking ${newBooking.id} has been assigned`
        }
        break
      case 'en_route':
        if (role === 'customer') {
          return `Your worker is on the way to your ${serviceType} service`
        } else if (role === 'admin') {
          return `Worker is en route to booking ${newBooking.id}`
        }
        break
      case 'in_progress':
        if (role === 'customer') {
          return `Your ${serviceType} service has started`
        } else if (role === 'admin') {
          return `Service in progress for booking ${newBooking.id}`
        }
        break
      case 'completed':
        if (role === 'customer') {
          return `Your ${serviceType} service has been completed!`
        } else if (role === 'worker') {
          return `Job completed: ${serviceType} - $${newBooking.price}`
        } else if (role === 'admin') {
          return `Booking ${newBooking.id} has been completed`
        }
        break
      case 'cancelled':
        if (role === 'customer') {
          return `Your ${serviceType} service has been cancelled`
        } else if (role === 'worker') {
          return `Job cancelled: ${serviceType}`
        } else if (role === 'admin') {
          return `Booking ${newBooking.id} has been cancelled`
        }
        break
    }

    return `Service status updated: ${newBooking.status.replace('_', ' ')}`
  }

  const getNotificationType = (status: string): 'success' | 'error' | 'info' => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'cancelled':
        return 'error'
      default:
        return 'info'
    }
  }


  return {
    // Utility functions for manual notifications
    notifyBookingUpdate: (booking: Booking, oldBooking: Booking) => 
      handleBookingUpdate(booking, oldBooking),
    notifyNewBooking: (booking: Booking) => 
      handleNewBooking(booking)
  }
}