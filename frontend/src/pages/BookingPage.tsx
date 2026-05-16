import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContextV2"
import api from "../services/apiV2"
import type { RoomType } from "../types/room"
import LoadingSpinner from "../components/ui/LoadingSpinner"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import Card from "../components/ui/Card"
import Badge from "../components/ui/Badge"

const BookingPage = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [room, setRoom] = useState<RoomType | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAadhaar: "",
    checkInDate: "",
    checkOutDate: "",
    numberOfGuests: 1,
    bookingType: "DAILY" as "DAILY" | "MONTHLY",
    monthlyMonths: 1, // Default 1 month for monthly booking
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [totalDays, setTotalDays] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const SECURITY_DEPOSIT = 2500

  useEffect(() => {
    fetchRoomDetails()
    window.scrollTo(0, 0)
  }, [roomId])

  // Auto-fill user details if available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: prev.customerName || user.name || "",
        customerEmail: prev.customerEmail || user.email || "",
        customerPhone: prev.customerPhone || user.phone || ""
      }))
    }
  }, [user])
  
  useEffect(() => {
    if (formData.bookingType === "MONTHLY" && formData.checkInDate) {
      // Auto-calculate checkout for monthly
      const checkIn = new Date(formData.checkInDate)
      const checkOut = new Date(checkIn)
      checkOut.setMonth(checkIn.getMonth() + formData.monthlyMonths)
      const checkOutStr = checkOut.toISOString().split('T')[0]
      setFormData(prev => ({ ...prev, checkOutDate: checkOutStr }))
    }
  }, [formData.checkInDate, formData.bookingType, formData.monthlyMonths])

  useEffect(() => {
    calculatePrice()
  }, [formData.checkInDate, formData.checkOutDate, formData.bookingType, room, formData.monthlyMonths])

  const fetchRoomDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/rooms/${roomId}`)
      const roomData = response.data
      setRoom(roomData)
      setFormData(prev => ({ ...prev, bookingType: roomData.bookingType }))
    } catch (error) {
      console.error('Error fetching room details:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const calculatePrice = () => {
    if (!formData.checkInDate || !formData.checkOutDate || !room) {
      setTotalDays(0)
      setTotalAmount(0)
      return
    }
    
    const checkIn = new Date(formData.checkInDate)
    const checkOut = new Date(formData.checkOutDate)
    const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    
    if (days > 0) {
      setTotalDays(days)
      if (formData.bookingType === "MONTHLY") {
        const pricePerMonth = room.monthlyPrice || room.price * 30
        setTotalAmount(Math.round(pricePerMonth * formData.monthlyMonths) + SECURITY_DEPOSIT)
      } else {
        const pricePerDay = room.dailyPrice || room.price
        setTotalAmount(pricePerDay * days)
      }
    } else {
      setTotalDays(0)
      setTotalAmount(0)
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }))
  }

  const handleBookingTypeChange = (type: "DAILY" | "MONTHLY") => {
    setFormData(prev => ({ 
      ...prev, 
      bookingType: type,
      checkInDate: "",
      checkOutDate: "",
      monthlyMonths: 1 
    }))
    setErrors({})
  }

  const handleExtendStay = () => {
    setFormData(prev => ({ ...prev, monthlyMonths: prev.monthlyMonths + 1 }))
  }
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.customerName.trim()) newErrors.customerName = "Name is required"
    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = "Email is invalid"
    }
    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = "Phone is required"
    } else if (!/^\d{10}$/.test(formData.customerPhone)) {
      newErrors.customerPhone = "Phone must be 10 digits"
    }
    if (!formData.checkInDate) newErrors.checkInDate = "Check-in date is required"
    if (!formData.checkOutDate) newErrors.checkOutDate = "Check-out date is required"
    
    if (formData.checkInDate && formData.checkOutDate) {
      const checkIn = new Date(formData.checkInDate)
      const checkOut = new Date(formData.checkOutDate)
      if (checkOut <= checkIn) newErrors.checkOutDate = "Check-out must be after check-in"
    }
    
    if (room && formData.numberOfGuests > room.capacity) {
      newErrors.numberOfGuests = `Maximum ${room.capacity} guests allowed`
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    
    try {
      setSubmitting(true)
      const bookingData = {
        roomId: Number(roomId),
        ...formData,
        numberOfGuests: Number(formData.numberOfGuests),
        totalAmount: totalAmount, // Pass calculated total amount (including deposit)
      }
      const response = await api.post("/bookings", bookingData)
      navigate(`/payment/${response.data.booking.id}`)
    } catch (error: any) {
      console.error('Error creating booking:', error)
      alert(error.response?.data?.message || 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <LoadingSpinner size="xl" text="Setting up your stay..." />
      </div>
    )
  }

  if (!room) return null

  const isMonthly = formData.bookingType === "MONTHLY"

  return (
    <div className="min-h-screen bg-gray-50/30 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-white shadow-sm border border-gray-100 rounded-lg transition-all active:scale-95">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Complete Your Stay</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Reserve your spot at Rabab Hostel</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 sm:p-8 border-none shadow-sm bg-white rounded-2xl">
              <form onSubmit={handleSubmit} className="space-y-8">
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-blue-100">1</div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">Personal Details</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Full Name" name="customerName" value={formData.customerName} onChange={handleInputChange} error={errors.customerName} placeholder="As per Aadhaar" className="bg-gray-50/30" />
                    <Input label="Email" name="customerEmail" type="email" value={formData.customerEmail} onChange={handleInputChange} error={errors.customerEmail} placeholder="your@email.com" className="bg-gray-50/30" />
                    <Input label="Phone" name="customerPhone" type="tel" value={formData.customerPhone} onChange={handleInputChange} error={errors.customerPhone} placeholder="10-digit mobile" className="bg-gray-50/30" />
                    <Input label="Aadhaar ID" name="customerAadhaar" value={formData.customerAadhaar} onChange={handleInputChange} placeholder="12-digit number" className="bg-gray-50/30" />
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-blue-100">2</div>
                      <h2 className="text-lg font-bold text-gray-900 tracking-tight">Stay Preferences</h2>
                    </div>
                    <div className="flex bg-gray-100/50 p-0.5 rounded-lg border border-gray-200/50">
                      {(["DAILY", "MONTHLY"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleBookingTypeChange(type)}
                          className={`px-4 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${formData.bookingType === type ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Check-in Date" name="checkInDate" type="date" value={formData.checkInDate} onChange={handleInputChange} error={errors.checkInDate} className="bg-gray-50/30" />
                    
                    {isMonthly ? (
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Auto Checkout</label>
                        <div className="relative">
                          <div className="w-full px-4 py-2.5 bg-blue-50/50 border border-blue-100 rounded-lg text-xs font-bold text-blue-700">
                            {formData.checkOutDate || 'Pick Check-in'}
                          </div>
                          <button 
                            type="button"
                            onClick={handleExtendStay}
                            disabled={!formData.checkInDate}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-600 text-white text-[8px] font-bold uppercase tracking-wider rounded shadow-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            Extend
                          </button>
                        </div>
                      </div>
                    ) : (
                      <Input label="Check-out Date" name="checkOutDate" type="date" value={formData.checkOutDate} onChange={handleInputChange} error={errors.checkOutDate} className="bg-gray-50/30" />
                    )}

                    <Input label="No. of Guests" name="numberOfGuests" type="number" min="1" max={room.capacity} value={formData.numberOfGuests} onChange={handleInputChange} error={errors.numberOfGuests} className="bg-gray-50/30" />
                  </div>
                  
                  {isMonthly && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-between text-white shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-wider opacity-80">Renter Perk</p>
                          <h3 className="text-xs font-bold">Best for Long Stay: Monthly Discount Applied</h3>
                        </div>
                      </div>
                      <Badge variant="secondary" size="sm" className="bg-white/20 border-none text-white">SAVE 25%</Badge>
                    </div>
                  )}
                </section>

                <div className="pt-6 border-t border-gray-100">
                  <Button type="submit" size="lg" className="w-full text-xs font-bold uppercase tracking-widest shadow-lg" isLoading={submitting}>
                    {submitting ? 'Confirming...' : 'Proceed to Payment'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              <Card className="p-6 border-none shadow-sm bg-white rounded-2xl border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-6 tracking-tight">Summary</h2>
                
                <div className="flex gap-4 mb-6 pb-6 border-b border-gray-50">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100">
                    <img src={room.images?.[0] || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">{room.title}</h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">#{room.roomNumber} • Floor {room.floor}</p>
                    <div className="mt-1.5 flex gap-1.5">
                      <Badge variant={room.roomType === 'AC' ? 'info' : 'secondary'} size="sm" className="text-[8px] px-1.5 py-0">{room.roomType}</Badge>
                      <Badge variant="primary" size="sm" className="text-[8px] px-1.5 py-0">{isMonthly ? 'LONG' : 'SHORT'}</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5 mb-6">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Rent</span>
                    <span className="font-bold text-gray-900">
                      ₹{isMonthly 
                        ? (room.monthlyPrice || room.price * 30).toLocaleString() 
                        : (room.dailyPrice || room.price).toLocaleString()
                      }
                      <span className="text-[8px] text-gray-400 ml-1">/ {isMonthly ? 'mo' : 'day'}</span>
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Stay</span>
                    <span className="font-bold text-gray-900">{isMonthly ? `${formData.monthlyMonths} Mo` : `${totalDays} Days`}</span>
                  </div>

                  {isMonthly && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-blue-600 uppercase tracking-widest text-[9px]">Deposit</span>
                      <span className="font-bold text-blue-700">₹{SECURITY_DEPOSIT.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-50 text-xs">
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Fee (12%)</span>
                    <span className="font-bold text-gray-900">₹{totalAmount > 0 ? Math.round(Math.max(0, totalAmount - (isMonthly ? SECURITY_DEPOSIT : 0)) * 0.12).toLocaleString() : '0'}</span>
                  </div>
                </div>

                <div className="bg-gray-50 -mx-6 px-6 py-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total Amount</p>
                      <p className="text-2xl font-black text-blue-700 tracking-tight">₹{(totalAmount + Math.round((totalAmount - (isMonthly ? SECURITY_DEPOSIT : 0)) * 0.12)).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-900 uppercase tracking-widest mb-0.5">Policy</h4>
                    <p className="text-[9px] font-bold text-gray-500 leading-relaxed">
                      Aadhaar ID required. {isMonthly && 'Security deposit is refundable.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingPage
