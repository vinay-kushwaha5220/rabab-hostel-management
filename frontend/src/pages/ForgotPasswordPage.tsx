import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import type { Variants } from "framer-motion"
import api from "../services/apiV2"
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle,
  KeyRound,
  ShieldCheck,
  ShieldAlert
} from "lucide-react"

const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [step, setStep] = useState(1) // 1: Request OTP, 2: Verify OTP, 3: Reset Password
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Timer for Resend OTP code
  const [resendTimer, setResendTimer] = useState(0)
  const timerRef = useRef<any>(null)

  // Premium, luxury warm minimalist bedroom background image
  const backgroundImageUrl = "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1600&q=80"

  // Countdown timer logic
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [resendTimer])

  const startResendTimer = () => {
    setResendTimer(60)
  }

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await api.post("/v2/auth/forgot-password", { email })
      setSuccess(response.data.message || "OTP code sent successfully!")
      setStep(2)
      startResendTimer()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to dispatch verification OTP.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resending) return
    
    setError("")
    setSuccess("")
    setResending(true)

    try {
      const response = await api.post("/v2/auth/forgot-password", { email })
      setSuccess(response.data.message || "A new OTP code has been sent!")
      startResendTimer()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend verification OTP.")
    } finally {
      setResending(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await api.post("/v2/auth/verify-otp", { 
        email, 
        otp: otp.trim() 
      })
      setSuccess(response.data.message || "Verification OTP successfully validated!")
      setStep(3)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to verify OTP code. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      const response = await api.post("/v2/auth/reset-password", {
        email,
        otp: otp.trim(),
        newPassword
      })
      setSuccess(response.data.message || "Password reset successfully!")
      
      // Auto redirect to login after 2.5 seconds
      setTimeout(() => {
        navigate("/login")
      }, 2500)
    } catch (err: any) {
      setError(err.response?.data?.message || "Password reset failed. Verify code.")
    } finally {
      setLoading(false)
    }
  }

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
      <div className="w-full max-w-[420px] px-4 z-20 max-h-[92vh] overflow-y-auto scrollbar-none py-4">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full bg-[#0E111E]/85 border border-slate-800/80 p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative backdrop-blur-md rounded-2xl overflow-hidden"
        >
          {/* Top brand indicator stripe */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          
          <div className="space-y-6">
            {/* Header / Brand title */}
            <motion.div variants={itemVariants} className="text-center">
              <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-wider">
                Rabab Stay
              </h2>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-1.5">
                {step === 1 && "Account Recovery"}
                {step === 2 && "OTP Verification"}
                {step === 3 && "Reset Password"}
              </p>
            </motion.div>

            {/* Success / Error Messages */}
            <AnimatePresence mode="wait">
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

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 bg-green-950/40 border border-green-900/35 rounded-lg flex gap-2.5 items-center"
                >
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <p className="text-[11px] text-green-300 font-semibold leading-tight">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {step === 1 && (
              /* STEP 1: Enter Email & Request OTP */
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recovery (Step 1/3)</span>
                  </div>
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">
                    Enter Account Email
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
                      <span>Send Reset OTP</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </motion.button>
              </form>
            )}

            {step === 2 && (
              /* STEP 2: Verify OTP Verification Code only */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verify Code (Step 2/3)</span>
                    </div>
                    {/* Resend Timer block */}
                    <div>
                      {resendTimer > 0 ? (
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">
                          Resend in {resendTimer}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={resending}
                          className="text-[9px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest focus:outline-none disabled:opacity-50 transition-colors"
                        >
                          {resending ? "Sending..." : "Resend OTP"}
                        </button>
                      )}
                    </div>
                  </div>
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">
                    6-Digit OTP Code *
                  </label>
                  <input
                    type="text"
                    placeholder="1 2 3 4 5 6"
                    maxLength={6}
                    className="w-full bg-[#080a13] border border-slate-800/80 focus:border-blue-600 focus:bg-[#0b0e1a] text-xs text-center font-bold tracking-[8px] text-white py-3 rounded-lg outline-none transition-all duration-300 placeholder:text-slate-600 shadow-inner"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    disabled={loading}
                    autoComplete="one-time-code"
                  />
                </motion.div>

                <motion.button
                  variants={itemVariants}
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full mt-2 relative overflow-hidden group bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/30"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Verify Code</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </motion.button>
              </form>
            )}

            {step === 3 && (
              /* STEP 3: Enter new password and confirm */
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Password (Step 3/3)</span>
                </div>

                {/* New Password */}
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">
                    New Password *
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••"
                      className="w-full bg-[#080a13] border border-slate-800/80 focus:border-blue-600 focus:bg-[#0b0e1a] text-xs text-white pl-10 pr-10 py-3 rounded-lg outline-none transition-all duration-300 placeholder:text-slate-600 shadow-inner"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={loading}
                      autoComplete="new-password"
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
                </motion.div>

                {/* Confirm Password */}
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">
                    Confirm Password *
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••"
                      className="w-full bg-[#080a13] border border-slate-800/80 focus:border-blue-600 focus:bg-[#0b0e1a] text-xs text-white pl-10 pr-10 py-3 rounded-lg outline-none transition-all duration-300 placeholder:text-slate-600 shadow-inner"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-355 transition-colors focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>

                {/* Reset Password Button */}
                <motion.button
                  variants={itemVariants}
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full mt-2 relative overflow-hidden group bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/30"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </motion.button>
              </form>
            )}

            {/* Return to Sign In Link */}
            <motion.div variants={itemVariants} className="pt-1 border-t border-slate-800/60">
              <Link
                to="/login"
                className="w-full py-2.5 px-4 block border border-slate-800/80 bg-[#080a13] hover:bg-[#0b0e1a] text-slate-300 hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 text-center"
              >
                Return to Sign In
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

export default ForgotPasswordPage
