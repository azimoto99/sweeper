import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CalendarIcon,
  MapIcon,
  CreditCardIcon,
  ShoppingCartIcon,
  UserIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  UsersIcon,
  BellIcon,
  ChatBubbleBottomCenterIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

import EmailVerificationBanner from '../auth/EmailVerificationBanner'
import { NotificationCenter } from '../notifications/NotificationCenter'
import { handleError, showSuccess } from '../../utils/errorHandler'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile, signOut } = useAuthContext()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      showSuccess('Signed out successfully')
      navigate('/auth/login')
    } catch (error) {
      handleError(error, { action: 'sign_out', userId: profile?.id })
    }
  }

  // Navigation items based on user role
  const getNavigationItems = () => {
    const commonItems = [
      { name: 'Dashboard', href: '/', icon: HomeIcon },
      { name: 'Profile', href: '/profile', icon: UserIcon },
    ]

    if (profile?.role === 'customer') {
      return [
        ...commonItems,
        { name: 'Book Service', href: '/book', icon: CalendarIcon },
        { name: 'Subscriptions', href: '/subscriptions', icon: CreditCardIcon },
        { name: 'Products', href: '/products', icon: ShoppingCartIcon },
        { name: 'Reviews', href: '/reviews', icon: ChatBubbleBottomCenterIcon },
      ]
    }

    if (profile?.role === 'worker') {
      return [
        { name: 'Worker Dashboard', href: '/worker', icon: MapIcon },
        { name: 'Profile', href: '/profile', icon: UserIcon },
      ]
    }

    if (profile?.role === 'admin') {
      return [
        ...commonItems,
        { name: 'Dispatch Center', href: '/admin/dispatch', icon: MapIcon },
        { name: 'Workers', href: '/admin/workers', icon: UsersIcon },
        { name: 'Bookings', href: '/admin/bookings', icon: CalendarIcon },
        { name: 'Services', href: '/admin/services', icon: SparklesIcon },
        { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
        { name: 'Products', href: '/products', icon: ShoppingCartIcon },
        { name: 'Settings', href: '/admin/settings', icon: CogIcon },
      ]
    }

    return commonItems
  }

  const navigation = getNavigationItems()

  return (
    <div className="h-screen flex" style={{ background: 'var(--vector-bg)' }}>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full glass border-r" style={{ borderColor: 'var(--vector-border)' }}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full glass focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent navigation={navigation} onSignOut={handleSignOut} profile={profile} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-72">
          <SidebarContent navigation={navigation} onSignOut={handleSignOut} profile={profile} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-20 glass border-b" style={{ borderColor: 'var(--vector-border)' }}>
          <button
            className="px-6 border-r border-white/20 text-gray-600 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 lg:hidden transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-6 flex justify-between items-center">
            <div className="flex-1 flex">
              <h1 className="text-3xl font-bold gradient-text">
                {getPageTitle(location.pathname)}
              </h1>
            </div>
            
            {/* Notifications */}
            <div className="ml-4 flex items-center space-x-4">
              <NotificationCenter />
              
              {/* User menu */}
              <div className="relative">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <span className="text-sm font-medium text-white">
                        {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-base font-semibold text-gray-800">{profile?.full_name}</div>
                    <div className="text-sm font-medium text-primary-600 capitalize">{profile?.role}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-transparent">
          <EmailVerificationBanner />
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ navigation, onSignOut, profile }: {
  navigation: any[]
  onSignOut: () => void
  profile: any
}) {
  const location = useLocation()

  return (
    <div className="flex flex-col h-full glass border-r" style={{ borderColor: 'var(--vector-border)' }}>
      {/* Logo */}
      <div className="flex items-center h-20 flex-shrink-0 px-6 bg-gradient-to-r from-primary-600 to-emerald-600">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-2xl glass flex items-center justify-center shadow-lg">
              <SparklesIcon className="h-7 w-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Sweeper</h1>
            <p className="text-xs text-white/80">Smart Cleaning Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1 px-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`${
                isActive
                  ? 'bg-gradient-to-r from-primary-500 to-emerald-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
              } group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-md`}
            >
              <item.icon
                className={`${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary-500'
                } mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200`}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User info and sign out */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-sm font-medium text-white">
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {profile?.full_name}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {profile?.role}
            </div>
          </div>
        </div>
        
        <button
          onClick={onSignOut}
          className="group flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-700 w-full transition-all duration-200"
        >
          <ArrowRightOnRectangleIcon className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-6 w-6" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

function getPageTitle(pathname: string): string {
  const routes: Record<string, string> = {
    '/': 'Dashboard',
    '/book': 'Book Service',
    '/subscriptions': 'Subscriptions',
    '/products': 'Products',
    '/reviews': 'Reviews',
    '/profile': 'Profile',
    '/worker': 'Worker Dashboard',
    '/admin/dispatch': 'Dispatch Center',
    '/admin/workers': 'Worker Management',
    '/admin/bookings': 'Booking Management',
    '/admin/analytics': 'Analytics',
    '/admin/settings': 'Settings',
  }

  return routes[pathname] || 'Sweeper'
}