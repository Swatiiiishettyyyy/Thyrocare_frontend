import React from 'react'
import clsx from 'clsx'
import type { BadgeProps } from '../../types'

const Badge = React.memo(function Badge({ label, variant = 'purple' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-3 py-1 rounded-pill text-sm font-medium',
        {
          'bg-purple-light text-purple': variant === 'purple',
          'bg-teal-light text-teal': variant === 'teal',
          'bg-orange-light text-orange': variant === 'orange',
          'bg-gray-100 text-gray': variant === 'gray',
        }
      )}
    >
      {label}
    </span>
  )
})

export { Badge }
