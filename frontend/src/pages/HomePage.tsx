import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/apiV2"
import type { RoomType } from "../types/room"
import Button from "../components/ui/Button"
import Card from "../components/ui/Card"
import LoadingSpinner from "../components/ui/LoadingSpinner"
import RoomCard from "../components/rooms/RoomCard"

const HomePage = () => {
  const navigate = useNavigate()
  const [featuredRooms, setFeaturedRooms] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedRooms()
  }, [])

  const fetchFeaturedRooms = async () => {
    try {
      const response = await api.get("/rooms")
      // Get first 6 rooms as featured
      setFeaturedRooms(response.data.slice(0, 6))
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Hero Section - Compact Height and Crisp Hierarchy */}
      <section className="relative h-[480px] sm:h-[540px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Premium Soft Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80"
            alt="Rabab Stay"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/95 via-blue-900/85 to-purple-900/40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight animate-fade-in leading-tight">
            Welcome to <span className="text-yellow-400 bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">Rabab Stay</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-200/90 mb-6 max-w-xl mx-auto font-medium leading-relaxed animate-fade-in-delay">
            Your Home Away From Home — Experience Comfort, Luxury & Hospitality at its finest.
          </p>
          <div className="flex flex-row gap-3 justify-center items-center animate-fade-in-delay-2">
            <Button
              size="sm"
              onClick={() => navigate('/rooms')}
              className="text-[10px] sm:text-xs px-5 py-2.5 font-bold uppercase tracking-wider shadow-lg transform hover:-translate-y-0.5 transition-transform"
            >
              Explore Rooms
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/contact')}
              className="text-[10px] sm:text-xs px-5 py-2.5 font-bold uppercase tracking-wider bg-white/10 backdrop-blur-sm border-white/60 text-white hover:bg-white hover:text-blue-900 transform hover:-translate-y-0.5 transition-all"
            >
              Contact Us
            </Button>
          </div>

          {/* Compact Premium Stats Overlay */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-8 sm:mt-10 max-w-lg mx-auto border-t border-white/10 pt-6 sm:pt-8">
            <div className="text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-yellow-400 tracking-tight mb-0.5">25+</p>
              <p className="text-[9px] sm:text-[10px] text-gray-300/90 font-bold uppercase tracking-wider">Rooms</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-yellow-400 tracking-tight mb-0.5">500+</p>
              <p className="text-[9px] sm:text-[10px] text-gray-300/90 font-bold uppercase tracking-wider">Guests</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-yellow-400 tracking-tight mb-0.5">4.8★</p>
              <p className="text-[9px] sm:text-[10px] text-gray-300/90 font-bold uppercase tracking-wider">Rating</p>
            </div>
          </div>
        </div>

        {/* Downward Scroll Indicator - Compact */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce opacity-80">
          <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Why Choose Us Section - Compact, Sleek Grids */}
      <section className="py-12 sm:py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1.5 tracking-tight">
              Why Choose Rabab Stay?
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-md mx-auto">
              Experience the perfect blend of premium home comfort and modern convenience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Feature 1 */}
            <Card className="p-5 text-center border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl bg-gray-50/30">
              <div className="w-11 h-11 bg-blue-50 border border-blue-100/50 rounded-xl flex items-center justify-center mx-auto mb-3 text-blue-600">
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 mb-1">Prime Location</h3>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium leading-relaxed">Centrally located with direct access to top city locations.</p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-5 text-center border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl bg-gray-50/30">
              <div className="w-11 h-11 bg-emerald-50 border border-emerald-100/50 rounded-xl flex items-center justify-center mx-auto mb-3 text-emerald-600">
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 mb-1">Affordable Rates</h3>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium leading-relaxed">Best value guarantee with completely transparent prices.</p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-5 text-center border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl bg-gray-50/30">
              <div className="w-11 h-11 bg-purple-50 border border-purple-100/50 rounded-xl flex items-center justify-center mx-auto mb-3 text-purple-600">
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 mb-1">24/7 Security</h3>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium leading-relaxed">Biometric checks and constant surveillance security.</p>
            </Card>

            {/* Feature 4 */}
            <Card className="p-5 text-center border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl bg-gray-50/30">
              <div className="w-11 h-11 bg-amber-50 border border-amber-100/50 rounded-xl flex items-center justify-center mx-auto mb-3 text-amber-600">
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 mb-1">Modern Amenities</h3>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium leading-relaxed">High-speed WiFi, smart TVs, and robust cooling units.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Rooms Section - Compact Grids */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1.5 tracking-tight">
              Our Featured Rooms
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-md mx-auto">
              Comfort, space, and premium styling matched in every layout.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" text="Loading catalog..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-sm sm:max-w-none mx-auto">
              {featuredRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Button
              size="sm"
              onClick={() => navigate('/rooms')}
              className="px-6 py-2.5 font-bold uppercase tracking-wider shadow-sm transform hover:-translate-y-0.5 transition-transform text-[10px] sm:text-xs"
            >
              View All Rooms
            </Button>
          </div>
        </div>
      </section>

      {/* Facilities Section - Ultra Compact Badges */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-blue-50/40 via-purple-50/30 to-blue-50/10 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1.5 tracking-tight">
              World-Class Facilities
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-md mx-auto">
              Everything hand-picked for an excellent residential residency.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { icon: '📶', name: 'Free WiFi' },
              { icon: '❄️', name: 'AC Rooms' },
              { icon: '📺', name: 'Smart TV' },
              { icon: '🚿', name: 'Hot Water' },
              { icon: '🍽️', name: 'Dining' },
              { icon: '🅿️', name: 'Parking' },
              { icon: '🧺', name: 'Laundry' },
              { icon: '🔒', name: 'Lockers' },
              { icon: '☕', name: 'Cafe' },
              { icon: '💼', name: 'Work Desk' },
              { icon: '🎮', name: 'Recreation' },
              { icon: '🏋️', name: 'Gym' },
            ].map((facility, index) => (
              <Card key={index} className="p-4 text-center border border-gray-100/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl bg-white">
                <div className="text-2xl mb-1.5">{facility.icon}</div>
                <p className="text-[11px] sm:text-xs font-bold text-gray-800 tracking-tight">{facility.name}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Compact Visual Balance */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1.5 tracking-tight">
              What Our Guests Say
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-md mx-auto">
              Read real resident feedback detailing their stay.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                name: 'Rahul Sharma',
                rating: 5,
                comment: 'Amazing experience! The rooms are exceptionally clean, staff is friendly, and the location is perfect. Highly recommended!',
                avatar: '👨‍💼'
              },
              {
                name: 'Priya Patel',
                rating: 5,
                comment: 'Best stay in the city! Modern amenities, extremely comfortable beds, and premium response times. Will definitely stay again!',
                avatar: '👩‍💼'
              },
              {
                name: 'Amit Kumar',
                rating: 5,
                comment: 'Absolute value for money! High-speed internet, smart laundry systems, and tidy desks. Perfect for students and workers alike.',
                avatar: '👨‍🎓'
              }
            ].map((testimonial, index) => (
              <Card key={index} className="p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl bg-gray-50/10">
                <div className="flex items-center mb-3">
                  <div className="text-xl mr-3 bg-gray-50 border border-gray-100 rounded-full w-9 h-9 flex items-center justify-center shadow-inner">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">{testimonial.name}</h4>
                    <div className="flex text-yellow-400 text-[10px] sm:text-[11px] mt-0.5">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500 italic font-medium leading-relaxed">"{testimonial.comment}"</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Elegant and Crisp */}
      <section className="py-12 sm:py-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-black mb-2.5 tracking-tight">
            Ready to Book Your Stay?
          </h2>
          <p className="text-xs sm:text-sm mb-6 text-white/90 max-w-lg mx-auto leading-relaxed font-medium">
            Unlock premium living at unbeatable daily and monthly rates. Secure your room in just 3 clicks!
          </p>
          <div className="flex flex-row gap-3 justify-center items-center">
            <Button
              size="sm"
              onClick={() => navigate('/rooms')}
              className="bg-white text-blue-600 hover:bg-gray-100 hover:text-blue-700 px-5 py-2.5 font-bold uppercase tracking-wider text-[10px] sm:text-xs shadow-md"
            >
              Book Now
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/contact')}
              className="border-white/80 text-white hover:bg-white hover:text-blue-600 px-5 py-2.5 font-bold uppercase tracking-wider text-[10px] sm:text-xs"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Custom Keyframes and Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
        }

        .animate-fade-in-delay-2 {
          animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
        }
      `}</style>
    </div>
  )
}

export default HomePage
