import React, { forwardRef, ButtonHTMLAttributes } from 'react'
import { LoadingIndicator } from '../layout/LoadingIndicator'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  rounded?: boolean
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
    disabled,
    className = '',
    children,
    ...props
  }, ref) => {
    const baseClasses = `
      inline-flex items-center justify-center font-medium transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2 
      disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
      ${fullWidth ? 'w-full' : ''}
      ${rounded ? 'rounded-full' : 'rounded-md'}
    `

    const sizeClasses = {
      xs: 'px-2.5 py-1.5 text-xs gap-1',
      sm: 'px-3 py-2 text-sm gap-1.5',
      md: 'px-4 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2',
      xl: 'px-8 py-4 text-lg gap-2.5'
    }

    const variantClasses = {
      primary: `
        bg-blue-600 text-white shadow-sm hover:bg-blue-700 
        focus:ring-blue-500 active:bg-blue-800
        disabled:bg-blue-300
      `,
      secondary: `
        bg-gray-600 text-white shadow-sm hover:bg-gray-700 
        focus:ring-gray-500 active:bg-gray-800
        disabled:bg-gray-300
      `,
      outline: `
        bg-white text-gray-700 border border-gray-300 shadow-sm 
        hover:bg-gray-50 hover:border-gray-400 
        focus:ring-blue-500 active:bg-gray-100
        disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200
      `,
      ghost: `
        bg-transparent text-gray-700 hover:bg-gray-100 
        focus:ring-gray-500 active:bg-gray-200
        disabled:text-gray-400 disabled:hover:bg-transparent
      `,
      danger: `
        bg-red-600 text-white shadow-sm hover:bg-red-700 
        focus:ring-red-500 active:bg-red-800
        disabled:bg-red-300
      `,
      success: `
        bg-green-600 text-white shadow-sm hover:bg-green-700 
        focus:ring-green-500 active:bg-green-800
        disabled:bg-green-300
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
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="flex-shrink-0" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            <span>{children}</span>
            {rightIcon && (
              <span className="flex-shrink-0" aria-hidden="true">
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

// Icon Button variant
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode
  'aria-label': string
  tooltip?: string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, tooltip, className = '', ...props }, ref) => {
    const sizeClasses = {
      xs: 'p-1',
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-2.5',
      xl: 'p-3'
    }

    return (
      <Button
        ref={ref}
        className={`${sizeClasses[props.size || 'md']} ${className}`}
        title={tooltip}
        {...props}
      >
        {icon}
      </Button>
    )
  }
)

IconButton.displayName = 'IconButton'

// Button Group component
interface ButtonGroupProps {
  children: React.ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical'
  spacing?: 'none' | 'sm' | 'md' | 'lg'
}

export function ButtonGroup({ 
  children, 
  className = '', 
  orientation = 'horizontal',
  spacing = 'sm'
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

  return (
    <div className={`${orientationClasses} ${spacingClasses[spacing]} ${className}`}>
      {children}
    </div>
  )
}

// Floating Action Button
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
    md: 'h-12 w-12',
    lg: 'h-14 w-14'
  }

  return (
    <Button
      variant="primary"
      rounded
      className={`
        ${positionClasses[position]}
        ${sizeClasses[size]}
        shadow-lg hover:shadow-xl
        z-50
        ${className}
      `}
      {...props}
    />
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

// Copy Button with feedback
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
      {...props}
    >
      {copied ? successText : children}
    </Button>
  )
}
