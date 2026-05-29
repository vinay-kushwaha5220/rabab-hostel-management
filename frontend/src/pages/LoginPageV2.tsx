import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useAuth } from "../context/AuthContextV2"
import { motion, AnimatePresence } from "framer-motion"
import type { Variants } from "framer-motion"
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldAlert
} from "lucide-react"

// Framer Motion Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 15 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 150, damping: 16 }
  }
}

const LoginPageV2 = () => {
  const { login } = useAuth()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Premium, luxury warm minimalist bedroom background image
  const backgroundImageUrl = "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1600&q=80"

  // Get redirect URL from query params
  const redirectUrl = searchParams.get("redirect")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(email, password)
    } catch (error: any) {
      setError(error.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-48px)] w-full overflow-hidden flex items-center justify-center bg-[#05060b] font-sans text-slate-200 select-none relative">
      {/* Full-screen bedroom background image with a subtle zoom/pulse animation */}
      <div 
        className="absolute inset-0 bg-cover bg-center select-none pointer-events-none scale-105 animate-[pulse_15s_infinite_alternate] z-0 opacity-80"
        style={{
          backgroundImage: `url(${backgroundImageUrl})`,
        }}
      />
      
      {/* Sleek multi-layered ambient overlay and dark gradient to make standard content pop */}
      <div className="absolute inset-0 bg-[#070911]/60 backdrop-blur-[3px] z-10" />

      {/* Decorative ambient neon or glow elements behind the card */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none z-10" />

      {/* Centered Popup Card Container */}
      <div className="w-full max-w-[420px] px-4 z-20">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full bg-[#0E111E]/85 border border-slate-800/80 p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative backdrop-blur-md rounded-2xl overflow-hidden"
        >
          {/* Top modern brand color indicator bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          
          <div className="space-y-6">
            {/* Header / Brand title */}
            <motion.div variants={itemVariants} className="text-center">
              <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-wider">
                Rabab Stay
              </h2>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-1.5">
                Client Portal Access
              </p>
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 bg-red-950/40 border border-red-900/35 rounded-lg flex gap-2.5 items-center"
                >
                  <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-[11px] text-red-300 font-semibold leading-tight">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Address */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="w-full bg-[#080a13] border border-slate-800/80 focus:border-blue-600 focus:bg-[#0b0e1a] text-xs text-white pl-10 pr-4 py-3 rounded-lg outline-none transition-all duration-300 placeholder:text-slate-600 shadow-inner"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    Password
                  </label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-[#080a13] border border-slate-800/80 focus:border-blue-600 focus:bg-[#0b0e1a] text-xs text-white pl-10 pr-10 py-3 rounded-lg outline-none transition-all duration-300 placeholder:text-slate-600 shadow-inner"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-1.5">
                  <Link to="/forgot-password" className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors font-bold tracking-wide uppercase">
                    Forgot?
                  </Link>
                </div>
              </motion.div>

              {/* Login Button */}
              <motion.button
                variants={itemVariants}
                type="submit"
                disabled={loading}
                className="w-full mt-2 relative overflow-hidden group bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/30"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Secure Login</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Create Account Link (Styled as clean outline button) */}
            <motion.div variants={itemVariants} className="pt-1 border-t border-slate-800/60">
              <Link
                to={`/register${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
                className="w-full py-2.5 px-4 block border border-slate-800/80 bg-[#080a13] hover:bg-[#0b0e1a] text-slate-300 hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 text-center"
              >
                Create New Account
              </Link>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Footer Info */}
        <div className="mt-6 flex justify-between items-center text-[9px] text-slate-500 uppercase tracking-widest font-semibold px-4">
          <p>© {new Date().getFullYear()} Rabab Stay.</p>
          <div className="flex gap-3">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:text-slate-400 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPageV2
