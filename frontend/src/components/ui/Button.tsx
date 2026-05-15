import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow transition-all duration-200',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 shadow-sm hover:shadow transition-all duration-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow transition-all duration-200',
    success: 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow transition-all duration-200',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50 transition-all duration-200',
  }
  
  const sizes = {
    sm: 'px-2 py-1 text-[10px] font-bold uppercase tracking-wider',
    md: 'px-3 py-1.5 text-xs font-bold uppercase tracking-wider',
    lg: 'px-4 py-2 text-sm font-black uppercase tracking-widest',
  }
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  )
}

export default Button
