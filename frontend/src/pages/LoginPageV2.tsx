import { useState, useEffect } from "react"
import { Link, useSearchParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContextV2"
import { motion, AnimatePresence } from "framer-motion"
import type { Variants } from "framer-motion"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Headphones,
  Home
} from "lucide-react"
import { GoogleLogin } from "@react-oauth/google"

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
      staggerChildren: 0.06,
      delayChildren: 0.05
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 150, damping: 16 }
  }
}

const LoginPageV2 = () => {
  const { login, loginWithSocial, user, accessToken, isLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Get redirect URL from query params
  const redirectUrl = searchParams.get("redirect")

  useEffect(() => {
    if (!isLoading && user && accessToken) {
      if (redirectUrl) {
        navigate(redirectUrl)
      } else if (user.role === "ADMIN") {
        navigate("/admin/dashboard")
      } else {
        navigate("/dashboard")
      }
    }
  }, [user, accessToken, isLoading, navigate, redirectUrl])

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Premium, luxury cozy bedroom background image
  const backgroundImageUrl = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80"

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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError("")
    setLoading(true)

    try {
      if (credentialResponse.credential) {
        await loginWithSocial(credentialResponse.credential, "google")
      }
    } catch (error: any) {
      setError(error.message || "Social login failed")
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
            <span className="font-extrabold text-xl tracking-tight text-white">Rabab Complex Stay</span>
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

      {/* RIGHT COLUMN: LOGIN FORM PANEL */}
      <div className="w-full md:w-1/2 lg:w-[52%] xl:w-[55%] flex flex-col justify-between p-6 sm:p-12 md:p-16 bg-[#F8FAFC] overflow-y-auto min-h-screen">

        {/* Navigation Bar (Top-Right) */}
        <div className="flex justify-between md:justify-end items-center mb-8 shrink-0">
          {/* Logo visible on Mobile only */}
          <div className="flex md:hidden items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="w-4.5 h-4.5 text-white stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">Rabab Complex Stay</span>
          </div>
          <div className="text-xs sm:text-sm text-slate-500 font-medium">
            New here?{" "}
            <Link
              to={`/register${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
              className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-all"
            >
              Create an account
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
                  Welcome Back
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-2">
                  Login to continue to your account
                </p>
              </div>

              {/* Error Message Alert */}
              <AnimatePresence>
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
              </AnimatePresence>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Address */}
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-semibold tracking-wide block uppercase">
                    Email Address
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

                {/* Password */}
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-semibold tracking-wide block uppercase">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 pl-11 pr-11 py-3 rounded-xl outline-none transition-all duration-200 placeholder:text-slate-400 font-medium"
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
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  {/* Forgot Password Link */}
                  <div className="flex justify-end mt-1">
                    <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 transition-colors font-bold hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </motion.div>

                {/* Submit Login Button */}
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
                      <span>Login</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Or continue with section */}
              <div className="relative my-4 flex items-center shrink-0">
                <div className="flex-1 border-t border-slate-100"></div>
                <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white">or continue with</span>
                <div className="flex-1 border-t border-slate-100"></div>
              </div>

              {/* Social Login Buttons - Cool & Minimalist Google Button */}
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    setError("Google Login Failed");
                  }}
                  useOneTap
                  theme="outline"
                  shape="pill"
                  text="signin_with"
                />
              </div>

              {/* Data Safety Security footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400">
                <ShieldCheck className="w-4 h-4 text-slate-400 stroke-[2.5]" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Your data is safe and secure with us.</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Unified Bottom Footer */}
        <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-medium shrink-0">
          <p>© {new Date().getFullYear()} Rabab Complex Stay. All rights reserved.</p>
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

export default LoginPageV2
