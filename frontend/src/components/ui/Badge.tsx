import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'primary',
  size = 'md' 
}) => {
  const variants = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    primary: 'bg-blue-100 text-blue-800 border-blue-200',
    secondary: 'bg-gray-100 text-gray-800 border-gray-200',
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] uppercase tracking-wider',
    md: 'px-2.5 py-0.5 text-xs font-bold',
    lg: 'px-3 py-1 text-sm font-bold',
  }
  
  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  )
}

export default Badge
