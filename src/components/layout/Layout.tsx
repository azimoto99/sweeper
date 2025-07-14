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
} from '@heroicons/react/24/outline'

import EmailVerificationBanner from '../auth/EmailVerificationBanner';

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile, signOut } = useAuthContext()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth/login')
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
        { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
        { name: 'Products', href: '/products', icon: ShoppingCartIcon },
        { name: 'Settings', href: '/admin/settings', icon: CogIcon },
      ]
    }

    return commonItems
  }

  const navigation = getNavigationItems()

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
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
        <div className="flex flex-col w-64">
          <SidebarContent navigation={navigation} onSignOut={handleSignOut} profile={profile} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200 lg:border-none">
          <button
            className="px-4 border-r border-gray-200 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          {/* Search bar or breadcrumbs could go here */}
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <h1 className="text-2xl font-semibold text-gray-900">
                {getPageTitle(location.pathname)}
              </h1>
            </div>
            
            {/* Notifications */}
            <div className="ml-4 flex items-center space-x-4">
              <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <BellIcon className="h-6 w-6" />
              </button>
              
              {/* User menu */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-base font-medium text-gray-800">{profile?.full_name}</div>
                    <div className="text-sm font-medium text-gray-500 capitalize">{profile?.role}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <EmailVerificationBanner />
          {children}
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
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary-600">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-lg font-bold text-primary-600">S</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-white">Sweeper</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-5 flex-1 px-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`${
                isActive
                  ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200`}
            >
              <item.icon
                className={`${
                  isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                } mr-3 flex-shrink-0 h-6 w-6`}
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
            <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
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
          className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 w-full transition-colors duration-200"
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