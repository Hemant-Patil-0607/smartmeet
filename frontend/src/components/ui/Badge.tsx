'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'primary';
  size?: 'sm' | 'md';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', size = 'sm', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          'chip',
          {
            'bg-success/10 text-success': variant === 'success',
            'bg-warning/10 text-warning': variant === 'warning',
            'bg-danger/10 text-danger': variant === 'danger',
            'bg-neutral/10 text-neutral': variant === 'neutral',
            'bg-primary/10 text-primary': variant === 'primary',
          },
          {
            'px-2 py-0.5 text-small': size === 'sm',
            'px-3 py-1 text-body': size === 'md',
          },
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
