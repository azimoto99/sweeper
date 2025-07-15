import React, { forwardRef, ButtonHTMLAttributes } from 'react'
import { LoadingIndicator } from '../layout/LoadingIndicator'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'gradient'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  rounded?: boolean
  glow?: boolean
  children: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    fullWidth = false,
    rounded = false,
    glow = false,
    disabled,
    className = '',
    children,
    ...props
  }, ref) => {
    const baseClasses = `
      inline-flex items-center justify-center font-semibold transition-all duration-300 ease-out
      focus:outline-none focus:ring-2 focus:ring-offset-2 relative overflow-hidden
      disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
      transform active:scale-95
      ${fullWidth ? 'w-full' : ''}
      ${rounded ? 'rounded-full' : 'rounded-xl'}
      ${glow && variant === 'primary' ? 'btn-glow' : ''}
    `

    const sizeClasses = {
      xs: 'px-3 py-2 text-xs gap-1.5 min-h-[32px]',
      sm: 'px-4 py-2.5 text-sm gap-2 min-h-[36px]',
      md: 'px-6 py-3 text-sm gap-2 min-h-[44px]',
      lg: 'px-8 py-4 text-base gap-2.5 min-h-[48px]',
      xl: 'px-10 py-5 text-lg gap-3 min-h-[56px]'
    }

    const variantClasses = {
      primary: `
        bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg 
        hover:from-emerald-700 hover:to-blue-700 hover:shadow-xl hover:-translate-y-0.5
        focus:ring-emerald-500 active:from-emerald-800 active:to-blue-800
        disabled:from-emerald-300 disabled:to-blue-300 disabled:transform-none disabled:shadow-md
        before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent 
        before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
      `,
      gradient: `
        bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white shadow-lg 
        hover:from-purple-700 hover:via-pink-700 hover:to-red-700 hover:shadow-xl hover:-translate-y-0.5
        focus:ring-purple-500 active:scale-95
        disabled:from-purple-300 disabled:via-pink-300 disabled:to-red-300 disabled:transform-none
        before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent 
        before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
      `,
      secondary: `
        bg-white text-gray-900 shadow-md border border-gray-200
        hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5
        focus:ring-gray-500 active:bg-gray-100
        disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:transform-none
      `,
      outline: `
        bg-transparent text-emerald-700 border-2 border-emerald-300 shadow-sm
        hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-800 hover:shadow-md hover:-translate-y-0.5
        focus:ring-emerald-500 active:bg-emerald-100
        disabled:bg-transparent disabled:text-gray-400 disabled:border-gray-200 disabled:transform-none
      `,
      ghost: `
        bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900
        focus:ring-gray-500 active:bg-gray-200 hover:-translate-y-0.5
        disabled:text-gray-400 disabled:hover:bg-transparent disabled:transform-none
      `,
      danger: `
        bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg 
        hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:-translate-y-0.5
        focus:ring-red-500 active:from-red-700 active:to-red-800
        disabled:from-red-300 disabled:to-red-400 disabled:transform-none disabled:shadow-md
        before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent 
        before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
      `,
      success: `
        bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg 
        hover:from-green-600 hover:to-emerald-700 hover:shadow-xl hover:-translate-y-0.5
        focus:ring-green-500 active:from-green-700 active:to-emerald-800
        disabled:from-green-300 disabled:to-emerald-400 disabled:transform-none disabled:shadow-md
        before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent 
        before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
      `
    }

    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          ${baseClasses}
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <LoadingIndicator 
              type="spinner" 
              size={size === 'xs' || size === 'sm' ? 'sm' : 'md'} 
              className="mr-0"
            />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            <span className="relative z-10">{children}</span>
            {rightIcon && (
              <span className="flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

// Enhanced Icon Button variant
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode
  'aria-label': string
  tooltip?: string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, tooltip, className = '', size = 'md', ...props }, ref) => {
    const sizeClasses = {
      xs: 'p-2',
      sm: 'p-2.5',
      md: 'p-3',
      lg: 'p-3.5',
      xl: 'p-4'
    }

    return (
      <Button
        ref={ref}
        size={size}
        className={`${sizeClasses[size]} ${className} group`}
        title={tooltip}
        {...props}
      >
        <span className="transition-transform duration-300 group-hover:scale-110">
          {icon}
        </span>
      </Button>
    )
  }
)

IconButton.displayName = 'IconButton'

// Enhanced Button Group component
interface ButtonGroupProps {
  children: React.ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical'
  spacing?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'separated' | 'joined'
}

export function ButtonGroup({ 
  children, 
  className = '', 
  orientation = 'horizontal',
  spacing = 'sm',
  variant = 'separated'
}: ButtonGroupProps) {
  const spacingClasses = {
    none: '',
    sm: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    md: orientation === 'horizontal' ? 'space-x-3' : 'space-y-3',
    lg: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4'
  }

  const orientationClasses = orientation === 'horizontal' 
    ? 'flex flex-row items-center' 
    : 'flex flex-col'

  if (variant === 'joined') {
    return (
      <div className={`${orientationClasses} ${className} rounded-xl overflow-hidden shadow-lg border border-gray-200`}>
        {React.Children.map(children, (child, index) => (
          <div className={`${index > 0 ? (orientation === 'horizontal' ? 'border-l border-gray-200' : 'border-t border-gray-200') : ''}`}>
            {child}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`${orientationClasses} ${spacingClasses[spacing]} ${className}`}>
      {children}
    </div>
  )
}

// Enhanced Floating Action Button
export interface FABProps extends Omit<ButtonProps, 'variant' | 'size'> {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  size?: 'md' | 'lg'
}

export function FloatingActionButton({ 
  position = 'bottom-right',
  size = 'lg',
  className = '',
  ...props 
}: FABProps) {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  }

  const sizeClasses = {
    md: 'h-14 w-14',
    lg: 'h-16 w-16'
  }

  return (
    <Button
      variant="primary"
      rounded
      glow
      className={`
        ${positionClasses[position]}
        ${sizeClasses[size]}
        shadow-2xl hover:shadow-emerald-500/25
        z-50 backdrop-blur-sm
        ${className}
      `}
      {...props}
    />
  )
}

// Loading Button with progress
interface LoadingButtonProps extends ButtonProps {
  progress?: number
}

export function LoadingButton({ progress, children, className = '', ...props }: LoadingButtonProps) {
  return (
    <div className="relative">
      <Button className={`relative overflow-hidden ${className}`} {...props}>
        {progress !== undefined && (
          <div 
            className="absolute inset-0 bg-white/20 transition-all duration-500 ease-out"
            style={{ 
              width: `${Math.min(100, Math.max(0, progress))}%`,
              left: 0
            }}
          />
        )}
        <span className="relative z-10">{children}</span>
      </Button>
    </div>
  )
}

// Link Button (looks like button but acts like link)
interface LinkButtonProps extends Omit<ButtonProps, 'as'> {
  href: string
  external?: boolean
}

export function LinkButton({ href, external = false, children, ...props }: LinkButtonProps) {
  const linkProps = external 
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {}

  return (
    <a href={href} {...linkProps} className="inline-block">
      <Button {...props}>
        {children}
      </Button>
    </a>
  )
}

// Copy Button with enhanced feedback
interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
  textToCopy: string
  onCopy?: () => void
  successText?: string
}

export function CopyButton({ 
  textToCopy, 
  onCopy, 
  successText = 'Copied!',
  children,
  ...props 
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      onCopy?.()
      
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  return (
    <Button
      onClick={handleCopy}
      variant={copied ? 'success' : props.variant}
      className={`transition-all duration-300 ${copied ? 'animate-scale-in' : ''}`}
      {...props}
    >
      {copied ? successText : children}
    </Button>
  )
}