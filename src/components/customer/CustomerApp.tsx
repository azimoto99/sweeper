import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '../layout/Layout'
import { CustomerDashboard } from './CustomerDashboard'
import { BookingHistory } from './BookingHistory'
import { ServiceTracking } from './ServiceTracking'

export function CustomerApp() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<CustomerDashboard />} />
        <Route path="/bookings" element={<BookingHistory />} />
        <Route path="/tracking/:bookingId" element={<ServiceTracking />} />
        <Route path="*" element={<Navigate to="/customer" replace />} />
      </Routes>
    </Layout>
  )
}
