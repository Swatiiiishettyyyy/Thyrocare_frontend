import React from 'react'
import clsx from 'clsx'
import type { ButtonProps } from '../../types'

const Button = React.memo(function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-pill font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple focus:ring-offset-2',
        {
          'bg-purple text-white hover:bg-purple/90': variant === 'primary',
          'border border-purple text-purple hover:bg-purple-light': variant === 'secondary',
          'text-navy hover:underline': variant === 'ghost',
        },
        {
          'px-4 py-1.5 text-sm': size === 'sm',
          'px-6 py-2 text-base': size === 'md',
          'px-8 py-3 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})

export { Button }
