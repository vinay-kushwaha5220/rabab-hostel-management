import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
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
  const [room, setRoom] = useState<RoomType | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAadhaar: "",
    checkInDate: "",
    checkOutDate: "",
    numberOfGuests: 1,
  })
  
  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Price calculation
  const [totalDays, setTotalDays] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)

  useEffect(() => {
    fetchRoomDetails()
  }, [roomId])
  
  useEffect(() => {
    calculatePrice()
  }, [formData.checkInDate, formData.checkOutDate, room])

  const fetchRoomDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/rooms/${roomId}`)
      setRoom(response.data)
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
      setTotalAmount(room.price * days)
    } else {
      setTotalDays(0)
      setTotalAmount(0)
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.customerName.trim()) {
      newErrors.customerName = "Name is required"
    }
    
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
    
    if (!formData.checkInDate) {
      newErrors.checkInDate = "Check-in date is required"
    }
    
    if (!formData.checkOutDate) {
      newErrors.checkOutDate = "Check-out date is required"
    }
    
    if (formData.checkInDate && formData.checkOutDate) {
      const checkIn = new Date(formData.checkInDate)
      const checkOut = new Date(formData.checkOutDate)
      
      if (checkOut <= checkIn) {
        newErrors.checkOutDate = "Check-out must be after check-in"
      }
    }
    
    if (formData.numberOfGuests < 1) {
      newErrors.numberOfGuests = "At least 1 guest required"
    }
    
    if (room && formData.numberOfGuests > room.capacity) {
      newErrors.numberOfGuests = `Maximum ${room.capacity} guests allowed`
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      setSubmitting(true)
      setErrors({}) // Clear previous errors
      
      // Create booking
      const bookingData = {
        roomId: Number(roomId),
        ...formData,
        numberOfGuests: Number(formData.numberOfGuests),
      }
      
      console.log('🔍 DEBUG: Sending booking data:', bookingData)
      
      const response = await api.post("/bookings", bookingData)
      
      console.log('✅ SUCCESS: Booking created:', response.data)
      
      // Navigate to payment page
      navigate(`/payment/${response.data.booking.id}`)
    } catch (error: any) {
      console.error('Error creating booking:', error)
      const errorMessage = error.response?.data?.message || 'Failed to create booking'
      
      // Handle specific error messages from backend
      if (errorMessage.includes("capacity")) {
        setErrors(prev => ({ ...prev, numberOfGuests: errorMessage }))
      } else if (errorMessage.includes("active booking")) {
        alert(errorMessage)
      } else {
        alert(errorMessage)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading booking details..." />
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Room Not Found</h2>
          <Button onClick={() => navigate('/rooms')}>Back to Rooms</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="outline" 
          onClick={() => navigate(`/rooms/${roomId}`)}
          className="mb-6"
        >
          ← Back to Room Details
        </Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Booking Form */}
          <div className="lg:col-span-2">
            <Card className="p-6 md:p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Complete Your Booking
              </h1>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Details Section */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b">
                    Guest Details
                  </h2>
                  
                  <div className="space-y-4">
                    <Input
                      label="Full Name *"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      error={errors.customerName}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      }
                    />
                    
                    <Input
                      label="Email Address *"
                      name="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      error={errors.customerEmail}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      }
                    />
                    
                    <Input
                      label="Phone Number *"
                      name="customerPhone"
                      type="tel"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile number"
                      error={errors.customerPhone}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      }
                    />
                    
                    <Input
                      label="Aadhaar / ID Number (Optional)"
                      name="customerAadhaar"
                      value={formData.customerAadhaar}
                      onChange={handleInputChange}
                      placeholder="Government ID for verification"
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                      }
                    />
                  </div>
                </div>
                
                {/* Booking Details Section */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b">
                    Booking Details
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Check-in Date *"
                      name="checkInDate"
                      type="date"
                      value={formData.checkInDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      error={errors.checkInDate}
                    />
                    
                    <Input
                      label="Check-out Date *"
                      name="checkOutDate"
                      type="date"
                      value={formData.checkOutDate}
                      onChange={handleInputChange}
                      min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                      error={errors.checkOutDate}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <Input
                      label={`Number of Guests * (Max: ${room.capacity})`}
                      name="numberOfGuests"
                      type="number"
                      value={formData.numberOfGuests}
                      onChange={handleInputChange}
                      min="1"
                      max={room.capacity}
                      error={errors.numberOfGuests}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      }
                    />
                  </div>
                </div>
                
                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={submitting}
                    disabled={submitting || !room.isAvailable}
                  >
                    {submitting ? 'Processing...' : 'Proceed to Payment'}
                  </Button>
                  
                  <p className="text-sm text-gray-500 text-center mt-3">
                    You won't be charged yet. Review your booking on the next page.
                  </p>
                </div>
              </form>
            </Card>
          </div>
          
          {/* Right Column - Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Booking Summary
              </h2>
              
              {/* Room Image */}
              <div className="mb-4 rounded-lg overflow-hidden">
                <img
                  src={room.images && room.images.length > 0 ? room.images[0] : 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'}
                  alt={room.title}
                  className="w-full h-40 object-cover"
                />
              </div>
              
              {/* Room Details */}
              <div className="mb-4">
                <h3 className="font-bold text-lg text-gray-900 mb-1">
                  {room.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Room {room.roomNumber} • Floor {room.floor}
                </p>
                <div className="flex gap-2">
                  <Badge variant={room.roomType === 'AC' ? 'info' : 'secondary'} size="sm">
                    {room.roomType}
                  </Badge>
                  <Badge variant="primary" size="sm">
                    {room.bookingType}
                  </Badge>
                </div>
              </div>
              
              {/* Booking Info */}
              <div className="border-t border-gray-200 pt-4 mb-4 space-y-3">
                {formData.checkInDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Check-in:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(formData.checkInDate).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                )}
                
                {formData.checkOutDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Check-out:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(formData.checkOutDate).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                )}
                
                {totalDays > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold text-gray-900">
                      {totalDays} {totalDays === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Guests:</span>
                  <span className="font-semibold text-gray-900">
                    {formData.numberOfGuests} {formData.numberOfGuests === 1 ? 'person' : 'people'}
                  </span>
                </div>
              </div>
              
              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    ₹{room.price.toLocaleString()} × {totalDays || 0} {totalDays === 1 ? 'day' : 'days'}
                  </span>
                  <span className="font-semibold text-gray-900">
                    ₹{totalAmount.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxes & fees</span>
                  <span className="font-semibold text-gray-900">
                    ₹{Math.round(totalAmount * 0.12).toLocaleString()}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">Total Price</span>
                  <span className="font-bold text-2xl text-blue-600">
                    ₹{(totalAmount + Math.round(totalAmount * 0.12)).toLocaleString()}
                  </span>
                </div>
              </div>
              
              {/* Info Note */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> Final payment will be processed on the next page. You can review all details before confirming.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingPage
