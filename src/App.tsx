import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { AuthProvider } from './contexts/AuthContext'
import { LoadingProvider } from './contexts/LoadingContext'
import { AuthGuard, AdminGuard, WorkerGuard, CustomerGuard } from './components/auth/AuthGuard'
import { LoginForm } from './components/auth/LoginForm'
import { SignupForm } from './components/auth/SignupForm'
import { DispatchCenter } from './components/admin/DispatchCenter'
import { AnalyticsDashboard } from './components/admin/AnalyticsDashboard'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './components/dashboard/Dashboard'
import { LandingPage } from './components/landing/LandingPage'
import { BookingPage } from './components/booking/BookingPage'
import { WorkerApp } from './components/worker/WorkerApp'
import { CustomerApp } from './components/customer/CustomerApp'
import { ProfilePage } from './components/profile/ProfilePage'
import { SubscriptionsPage } from './components/subscriptions/SubscriptionsPage'
import { ProductsPage } from './components/products/ProductsPage'
import { ReviewsPage } from './components/reviews/ReviewsPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import AuthCallbackPage from './pages/auth/AuthCallbackPage'
import HandleResetPasswordPage from './pages/auth/HandleResetPasswordPage'
import EmailVerifiedPage from './pages/auth/EmailVerifiedPage'
import TermsPage from './pages/legal/terms'
import PrivacyPage from './pages/legal/privacy'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <AuthProvider>
        <LoadingProvider>
          <Toaster position="bottom-center" />
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/auth/login" element={<LoginForm />} />
              <Route path="/auth/signup" element={<SignupForm />} />
              <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/handle-reset-password" element={<HandleResetPasswordPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/auth/email-verified" element={<EmailVerifiedPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />

              {/* Protected dashboard */}
              <Route path="/dashboard" element={
                <AuthGuard>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </AuthGuard>
              } />

              {/* Customer routes */}
              <Route path="/customer" element={
                <CustomerGuard>
                  <CustomerApp />
                </CustomerGuard>
              } />


              <Route path="/subscriptions" element={
                <CustomerGuard>
                  <Layout>
                    <SubscriptionsPage />
                  </Layout>
                </CustomerGuard>
              } />

              <Route path="/products" element={
                <AuthGuard>
                  <Layout>
                    <ProductsPage />
                  </Layout>
                </AuthGuard>
              } />

              <Route path="/reviews" element={
                <AuthGuard>
                  <Layout>
                    <ReviewsPage />
                  </Layout>
                </AuthGuard>
              } />

              {/* Worker routes */}
              <Route path="/worker" element={
                <WorkerGuard>
                  <WorkerApp />
                </WorkerGuard>
              } />

              {/* Admin routes */}
              <Route path="/admin/dispatch" element={
                <AdminGuard>
                  <DispatchCenter />
                </AdminGuard>
              } />

              <Route path="/admin/*" element={
                <AdminGuard>
                  <Layout>
                    <AdminRoutes />
                  </Layout>
                </AdminGuard>
              } />

              {/* Shared routes */}
              <Route path="/profile" element={
                <AuthGuard>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </AuthGuard>
              } />

              {/* Redirect unknown routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </LoadingProvider>
      </AuthProvider>
    </DndProvider>
  )
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="workers" element={<div>Worker Management</div>} />
      <Route path="bookings" element={<div>Booking Management</div>} />
      <Route path="analytics" element={<AnalyticsDashboard />} />
      <Route path="settings" element={<div>Settings</div>} />
      <Route path="" element={<Navigate to="/admin/dispatch" replace />} />
    </Routes>
  )
}

export default App
