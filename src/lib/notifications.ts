import { supabase } from './supabase'

interface NotificationData {
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  action_url?: string
  booking_id?: string
}

export async function sendNotification(data: NotificationData) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        ...data,
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error sending notification:', error)
    return false
  }
}

export async function sendBulkNotifications(notifications: NotificationData[]) {
  try {
    const notificationsWithTimestamps = notifications.map(notification => ({
      ...notification,
      read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('notifications')
      .insert(notificationsWithTimestamps)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error sending bulk notifications:', error)
    return false
  }
}

export async function sendBookingNotification(
  booking: any,
  userIds: string[],
  type: 'created' | 'updated' | 'assigned' | 'completed' | 'cancelled'
) {
  const serviceType = booking.service_type.replace('_', ' ').toUpperCase()
  
  let title = ''
  let message = ''
  let notificationType: 'info' | 'success' | 'warning' | 'error' = 'info'
  let actionUrl = ''

  switch (type) {
    case 'created':
      title = 'New Booking Created'
      message = `New ${serviceType} booking for ${booking.scheduled_date} - $${booking.price}`
      notificationType = 'info'
      actionUrl = '/admin/dispatch'
      break
    case 'updated':
      title = 'Booking Updated'
      message = `Your ${serviceType} booking has been updated`
      notificationType = 'info'
      actionUrl = '/customer'
      break
    case 'assigned':
      title = 'Worker Assigned'
      message = `A worker has been assigned to your ${serviceType} service`
      notificationType = 'success'
      actionUrl = '/customer'
      break
    case 'completed':
      title = 'Service Completed'
      message = `Your ${serviceType} service has been completed!`
      notificationType = 'success'
      actionUrl = '/customer'
      break
    case 'cancelled':
      title = 'Booking Cancelled'
      message = `Your ${serviceType} service has been cancelled`
      notificationType = 'error'
      actionUrl = '/customer'
      break
  }

  const notifications = userIds.map(userId => ({
    user_id: userId,
    title,
    message,
    type: notificationType,
    action_url: actionUrl,
    booking_id: booking.id
  }))

  return await sendBulkNotifications(notifications)
}

export async function sendWorkerNotification(
  workerId: string,
  booking: any,
  type: 'assigned' | 'updated' | 'cancelled'
) {
  const serviceType = booking.service_type.replace('_', ' ').toUpperCase()
  
  let title = ''
  let message = ''
  let notificationType: 'info' | 'success' | 'warning' | 'error' = 'info'

  switch (type) {
    case 'assigned':
      title = 'New Job Assigned'
      message = `New ${serviceType} job assigned - $${booking.price}`
      notificationType = 'success'
      break
    case 'updated':
      title = 'Job Updated'
      message = `Your ${serviceType} job details have been updated`
      notificationType = 'info'
      break
    case 'cancelled':
      title = 'Job Cancelled'
      message = `Your ${serviceType} job has been cancelled`
      notificationType = 'error'
      break
  }

  return await sendNotification({
    user_id: workerId,
    title,
    message,
    type: notificationType,
    action_url: '/worker',
    booking_id: booking.id
  })
}

export async function sendStatusUpdateNotification(
  booking: any,
  oldStatus: string,
  newStatus: string
) {
  const serviceType = booking.service_type.replace('_', ' ').toUpperCase()
  
  // Determine who should receive the notification
  const recipients = []
  
  // Always notify the customer
  if (booking.user_id) {
    recipients.push(booking.user_id)
  }
  
  // Notify admin for all status changes
  const { data: adminUsers } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
  
  if (adminUsers) {
    recipients.push(...adminUsers.map(u => u.id))
  }

  // Notify worker for relevant status changes
  if (booking.worker_id && ['assigned', 'cancelled'].includes(newStatus)) {
    recipients.push(booking.worker_id)
  }

  let title = ''
  let message = ''
  let notificationType: 'info' | 'success' | 'warning' | 'error' = 'info'

  switch (newStatus) {
    case 'assigned':
      title = 'Booking Assigned'
      message = `${serviceType} service has been assigned to a worker`
      notificationType = 'success'
      break
    case 'en_route':
      title = 'Worker En Route'
      message = `Your worker is on the way to your ${serviceType} service`
      notificationType = 'info'
      break
    case 'in_progress':
      title = 'Service Started'
      message = `Your ${serviceType} service has started`
      notificationType = 'info'
      break
    case 'completed':
      title = 'Service Completed'
      message = `Your ${serviceType} service has been completed!`
      notificationType = 'success'
      break
    case 'cancelled':
      title = 'Service Cancelled'
      message = `Your ${serviceType} service has been cancelled`
      notificationType = 'error'
      break
  }

  const notifications = recipients.map(userId => ({
    user_id: userId,
    title,
    message,
    type: notificationType,
    action_url: userId === booking.user_id ? '/customer' : 
                userId === booking.worker_id ? '/worker' : '/admin/dispatch',
    booking_id: booking.id
  }))

  return await sendBulkNotifications(notifications)
}

export async function sendPaymentNotification(
  userId: string,
  booking: any,
  type: 'success' | 'failed' | 'refunded'
) {
  const serviceType = booking.service_type.replace('_', ' ').toUpperCase()
  
  let title = ''
  let message = ''
  let notificationType: 'info' | 'success' | 'warning' | 'error' = 'info'

  switch (type) {
    case 'success':
      title = 'Payment Confirmed'
      message = `Payment of $${booking.price} for your ${serviceType} service has been confirmed`
      notificationType = 'success'
      break
    case 'failed':
      title = 'Payment Failed'
      message = `Payment for your ${serviceType} service could not be processed`
      notificationType = 'error'
      break
    case 'refunded':
      title = 'Payment Refunded'
      message = `Your payment of $${booking.price} for ${serviceType} service has been refunded`
      notificationType = 'info'
      break
  }

  return await sendNotification({
    user_id: userId,
    title,
    message,
    type: notificationType,
    action_url: '/customer',
    booking_id: booking.id
  })
}

export async function sendSystemNotification(
  userIds: string[],
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
  const notifications = userIds.map(userId => ({
    user_id: userId,
    title,
    message,
    type
  }))

  return await sendBulkNotifications(notifications)
}