const Logo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  }

  return (
    <div className="flex items-center gap-2">
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg`}>
        <svg
          className="w-full h-full p-1.5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {/* Building/Hotel Icon */}
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
          <line x1="9" y1="5" x2="9" y2="9" />
          <line x1="15" y1="5" x2="15" y2="9" />
          <line x1="9" y1="13" x2="9" y2="17" />
          <line x1="15" y1="13" x2="15" y2="17" />
        </svg>
      </div>

      {/* Logo Text */}
      <div className="flex flex-col">
        <span className={`${textSizeClasses[size]} font-semibold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent`}>
          Rabab Complex
        </span>
        <span className={`text-xs font-semibold text-gray-600 -mt-1`}>
          STAY
        </span>
      </div>
    </div>
  )
}

export default Logo
