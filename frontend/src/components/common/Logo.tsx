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
      {/* Logo Image */}
      <img
        src="/avatar.jpg"
        alt="Rabab Complex Stay"
        className={`${sizeClasses[size]} rounded-full object-cover border border-amber-400 shadow-md`}
      />

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
