import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'
import {
  HomeIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  BellIcon,
  Cog6ToothIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  UsersIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  CalendarIcon as CalendarIconSolid,
  MapPinIcon as MapPinIconSolid,
  UserIcon as UserIconSolid,
  BellIcon as BellIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  UsersIcon as UsersIconSolid
} from '@heroicons/react/24/solid'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  activeIcon: React.ComponentType<{ className?: string }>
  badge?: number
  roles?: string[]
}

export function MobileNavigation() {
  const { profile } = useAuthContext()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(0)

  // Navigation items based on user role
  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      {
        name: 'Home',
        href: '/',
        icon: HomeIcon,
        activeIcon: HomeIconSolid
      }
    ]

    if (profile?.role === 'customer') {
      return [
        ...baseItems,
        {
          name: 'Book',
          href: '/booking',
          icon: PlusIcon,
          activeIcon: PlusIcon
        },
        {
          name: 'Bookings',
          href: '/customer/bookings',
          icon: CalendarIcon,
          activeIcon: CalendarIconSolid
        },
        {
          name: 'Track',
          href: '/customer/tracking',
          icon: MapPinIcon,
          activeIcon: MapPinIconSolid
        },
        {
          name: 'Profile',
          href: '/customer/profile',
          icon: UserIcon,
          activeIcon: UserIconSolid
        }
      ]
    }

    if (profile?.role === 'worker') {
      return [
        ...baseItems,
        {
          name: 'Jobs',
          href: '/worker/dashboard',
          icon: ClipboardDocumentListIcon,
          activeIcon: ClipboardDocumentListIconSolid
        },
        {
          name: 'Map',
          href: '/worker/map',
          icon: MapPinIcon,
          activeIcon: MapPinIconSolid
        },
        {
          name: 'Schedule',
          href: '/worker/schedule',
          icon: CalendarIcon,
          activeIcon: CalendarIconSolid
        },
        {
          name: 'Profile',
          href: '/worker/profile',
          icon: UserIcon,
          activeIcon: UserIconSolid
        }
      ]
    }

    if (profile?.role === 'admin') {
      return [
        ...baseItems,
        {
          name: 'Dashboard',
          href: '/admin/dashboard',
          icon: ChartBarIcon,
          activeIcon: ChartBarIconSolid
        },
        {
          name: 'Bookings',
          href: '/admin/bookings',
          icon: CalendarIcon,
          activeIcon: CalendarIconSolid
        },
        {
          name: 'Workers',
          href: '/admin/workers',
          icon: UsersIcon,
          activeIcon: UsersIconSolid
        },
        {
          name: 'Dispatch',
          href: '/admin/dispatch',
          icon: MapPinIcon,
          activeIcon: MapPinIconSolid
        }
      ]
    }

    return baseItems
  }

  const navItems = getNavItems()

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-gray-900">Sweeper</span>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md">
            <BellIcon className="h-6 w-6" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications > 9 ? '9+' : notifications}
              </span>
            )}
          </button>

          {/* Profile Avatar */}
          <Link
            to={`/${profile?.role}/profile`}
            className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
          </Link>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-25"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="relative flex flex-col w-80 max-w-xs bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">M</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Sweeper</h2>
                  <p className="text-sm text-gray-500 capitalize">{profile?.role} Portal</p>
                </div>
              </div>
              
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close menu"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const active = isActive(item.href)
                const Icon = active ? item.activeIcon : item.icon
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${active ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    {item.name}
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto bg-red-100 text-red-600 text-xs font-medium px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4">
              <Link
                to="/settings"
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900"
              >
                <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                Settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar (Alternative mobile navigation) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-30">
        <div className="flex justify-around">
          {navItems.slice(0, 5).map((item) => {
            const active = isActive(item.href)
            const Icon = active ? item.activeIcon : item.icon
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1 font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Spacer for bottom tab bar */}
      <div className="lg:hidden h-16" />
    </>
  )
}
