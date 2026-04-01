import React from 'react'
import clsx from 'clsx'
import type { SectionHeadingProps } from '../../types'

const SectionHeading = React.memo(function SectionHeading({
  title,
  subtitle,
  align = 'left',
}: SectionHeadingProps) {
  return (
    <div className={clsx('mb-8', { 'text-center': align === 'center', 'text-left': align === 'left' })}>
      <h2 className="text-h2 text-navy font-medium">{title}</h2>
      {subtitle && <p className="text-b1 text-gray mt-1">{subtitle}</p>}
    </div>
  )
})

export { SectionHeading }
