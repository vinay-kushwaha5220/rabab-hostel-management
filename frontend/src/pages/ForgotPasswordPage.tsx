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
  ShieldAlert,
  Calendar,
  Headphones,
  Home
} from "lucide-react"

// Framer Motion Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18,
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

  // Premium, luxury cozy bedroom background image
  const backgroundImageUrl = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80"

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

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F8FAFC] font-sans antialiased text-slate-800">
      
      {/* LEFT COLUMN: BRANDING & FEATURES PANEL (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/2 lg:w-[48%] xl:w-[45%] flex-col justify-between p-12 text-white relative overflow-hidden bg-slate-950">
        
        {/* Full-size bedroom background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center select-none pointer-events-none scale-105 animate-[pulse_20s_infinite_alternate] z-0 opacity-70"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
          }}
        />
        
        {/* Multi-layered dark ambient overlay to ensure perfect text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090D1A]/95 via-[#0F172A]/70 to-[#0F172A]/40 z-10" />
        
        {/* Radial ambient indigo/blue glow for extra depth */}
        <div className="absolute -bottom-10 -left-10 w-[350px] h-[350px] rounded-full bg-blue-600/20 blur-[100px] pointer-events-none z-10" />

        {/* Branding (Top) */}
        <div className="relative z-20">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Home className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">Rabab Stay</span>
          </Link>
        </div>

        {/* Hero Title & Subtitle (Middle) */}
        <div className="relative z-20 my-auto py-12 space-y-4">
          <h1 className="text-4xl lg:text-5xl font-black leading-tight tracking-tight text-white font-sans">
            Find. Book. Stay.
          </h1>
          <p className="text-base lg:text-lg text-slate-200 font-medium max-w-md leading-relaxed">
            Your perfect room is just a click away. Find high-quality hostels and accommodations tailored to your needs.
          </p>
        </div>

        {/* Key bullet features with outline Lucide icons (Bottom) */}
        <div className="relative z-20 space-y-6 pt-6 border-t border-white/10">
          {/* Feature 1 */}
          <div className="flex gap-4 items-start">
            <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl shrink-0">
              <ShieldCheck className="w-5 h-5 text-blue-400 stroke-[2]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Verified Rooms</h4>
              <p className="text-xs text-slate-300 mt-0.5">Quality rooms and properties you can trust.</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex gap-4 items-start">
            <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl shrink-0">
              <Calendar className="w-5 h-5 text-blue-400 stroke-[2]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Easy Booking</h4>
              <p className="text-xs text-slate-300 mt-0.5">Book in minutes, stay with absolute comfort.</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex gap-4 items-start">
            <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl shrink-0">
              <Headphones className="w-5 h-5 text-blue-400 stroke-[2]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">24/7 Support</h4>
              <p className="text-xs text-slate-300 mt-0.5">Our dedicated support team is here for you anytime.</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: RECOVERY FORM PANEL */}
      <div className="w-full md:w-1/2 lg:w-[52%] xl:w-[55%] flex flex-col justify-between p-6 sm:p-12 md:p-16 bg-[#F8FAFC] overflow-y-auto min-h-screen">
        
        {/* Navigation Bar (Top-Right) */}
        <div className="flex justify-between md:justify-end items-center mb-8 shrink-0">
          {/* Logo visible on Mobile only */}
          <div className="flex md:hidden items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="w-4.5 h-4.5 text-white stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">Rabab Stay</span>
          </div>
          <div className="text-xs sm:text-sm text-slate-500 font-medium">
            Remembered password?{" "}
            <Link 
              to="/login" 
              className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Center Card Container */}
        <div className="w-full max-w-[440px] mx-auto my-auto py-8">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full bg-white border border-slate-100 p-6 sm:p-10 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.06)] rounded-2xl relative"
          >
            <div className="space-y-6">
              {/* Header Titles */}
              <div className="text-center md:text-left">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {step === 1 && "Account Recovery"}
                  {step === 2 && "OTP Verification"}
                  {step === 3 && "Reset Password"}
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-2">
                  {step === 1 && "Enter your email to receive a recovery code"}
                  {step === 2 && "Verify the code sent to your inbox"}
                  {step === 3 && "Enter your new credentials"}
                </p>
              </div>

              {/* Status Alerts */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-2.5 items-center"
                  >
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 stroke-[2]" />
                    <p className="text-xs text-red-700 font-semibold leading-normal">{error}</p>
                  </motion.div>
                )}

                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3 bg-green-50 border border-green-100 rounded-xl flex gap-2.5 items-center"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 stroke-[2]" />
                    <p className="text-xs text-green-700 font-semibold leading-normal">{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {step === 1 && (
                /* STEP 1: Enter Email & Request OTP */
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <motion.div variants={itemVariants} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <KeyRound className="w-4 h-4 text-blue-500 stroke-[2]" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recovery (Step 1/3)</span>
                    </div>
                    <label className="text-xs text-slate-500 font-semibold tracking-wide block uppercase">
                      Enter Account Email
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="email"
                        placeholder="name@example.com"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 pl-11 pr-4 py-3 rounded-xl outline-none transition-all duration-200 placeholder:text-slate-400 font-medium"
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
                    className="w-full mt-2 relative overflow-hidden group bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(37,99,235,0.15)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send Reset OTP</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              {step === 2 && (
                /* STEP 2: Verify OTP Verification Code only */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <motion.div variants={itemVariants} className="space-y-1.5">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-500 stroke-[2]" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verify Code (Step 2/3)</span>
                      </div>
                      {/* Resend Timer block */}
                      <div>
                        {resendTimer > 0 ? (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Resend in {resendTimer}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resending}
                            className="text-[10px] text-blue-600 hover:text-blue-700 font-bold uppercase tracking-wider focus:outline-none disabled:opacity-50 transition-colors"
                          >
                            {resending ? "Sending..." : "Resend OTP"}
                          </button>
                        )}
                      </div>
                    </div>
                    <label className="text-xs text-slate-500 font-semibold tracking-wide block uppercase">
                      6-Digit OTP Code *
                    </label>
                    <input
                      type="text"
                      placeholder="1 2 3 4 5 6"
                      maxLength={6}
                      className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-center font-bold tracking-[8px] text-slate-900 py-3 rounded-xl outline-none transition-all duration-200 placeholder:text-slate-400 shadow-inner"
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
                    className="w-full mt-2 relative overflow-hidden group bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(37,99,235,0.15)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Verify Code</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              {step === 3 && (
                /* STEP 3: Enter new password and confirm */
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-500 stroke-[2]" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Password (Step 3/3)</span>
                  </div>

                  {/* New Password */}
                  <motion.div variants={itemVariants} className="space-y-1.5">
                    <label className="text-xs text-slate-500 font-semibold tracking-wide block uppercase">
                      New Password *
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 pl-11 pr-11 py-3 rounded-xl outline-none transition-all duration-200 placeholder:text-slate-400 font-medium"
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
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div variants={itemVariants} className="space-y-1.5">
                    <label className="text-xs text-slate-500 font-semibold tracking-wide block uppercase">
                      Confirm Password *
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 pl-11 pr-11 py-3 rounded-xl outline-none transition-all duration-200 placeholder:text-slate-400 font-medium"
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
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Reset Password Button */}
                  <motion.button
                    variants={itemVariants}
                    type="submit"
                    disabled={loading || !newPassword || !confirmPassword}
                    className="w-full mt-2 relative overflow-hidden group bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(37,99,235,0.15)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              {/* Return to Sign In button */}
              <div className="pt-4 border-t border-slate-100">
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 block border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 text-center"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Unified Bottom Footer */}
        <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-medium shrink-0">
          <p>© {new Date().getFullYear()} Rabab Stay. All rights reserved.</p>
          <div className="flex gap-3">
            <Link to="#" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
            <span>|</span>
            <Link to="#" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
            <span>|</span>
            <Link to="/contact" className="hover:text-slate-600 transition-colors">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
