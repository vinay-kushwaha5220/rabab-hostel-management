import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/apiV2"
import type { RoomType } from "../types/room"
import Button from "../components/ui/Button"
import Card from "../components/ui/Card"
import Badge from "../components/ui/Badge"
import LoadingSpinner from "../components/ui/LoadingSpinner"

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920"
            alt="Rabab Stay"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/80"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in">
            Welcome to <span className="text-yellow-400">Rabab Stay</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 animate-fade-in-delay">
            Your Home Away From Home - Experience Comfort, Luxury & Hospitality
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-2">
            <Button
              size="lg"
              onClick={() => navigate('/rooms')}
              className="text-lg px-8 py-4 transform hover:scale-105 transition-transform"
            >
              Explore Our Rooms
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/contact')}
              className="text-lg px-8 py-4 bg-white/10 backdrop-blur-sm border-white text-white hover:bg-white hover:text-blue-900 transform hover:scale-105 transition-all"
            >
              Contact Us
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
            <div className="text-center">
              <p className="text-4xl font-bold text-yellow-400 mb-2">25+</p>
              <p className="text-gray-200">Rooms</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-yellow-400 mb-2">500+</p>
              <p className="text-gray-200">Happy Guests</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-yellow-400 mb-2">4.8★</p>
              <p className="text-gray-200">Rating</p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Rabab Stay?
            </h2>
            <p className="text-xl text-gray-600">
              Experience the perfect blend of comfort and convenience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Prime Location</h3>
              <p className="text-gray-600">Centrally located with easy access to major attractions</p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Affordable Rates</h3>
              <p className="text-gray-600">Best prices with no hidden charges</p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">24/7 Security</h3>
              <p className="text-gray-600">Your safety is our top priority</p>
            </Card>

            {/* Feature 4 */}
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Modern Amenities</h3>
              <p className="text-gray-600">WiFi, AC, TV and more in every room</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Featured Rooms
            </h2>
            <p className="text-xl text-gray-600">
              Discover comfort and luxury in every corner
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Loading rooms..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredRooms.map((room) => (
                <Card key={room.id} hover className="group overflow-hidden">
                  {/* Room Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={room.images && room.images.length > 0 ? room.images[0] : 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'}
                      alt={room.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge variant={room.isAvailable ? 'success' : 'danger'}>
                        {room.isAvailable ? 'Available' : 'Booked'}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      <Badge variant={room.roomType === 'AC' ? 'info' : 'secondary'}>
                        {room.roomType}
                      </Badge>
                      <Badge variant="primary">
                        {room.bookingType}
                      </Badge>
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {room.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {room.description}
                    </p>

                    {/* Room Info */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {room.capacity} Guests
                      </div>
                      <div className="text-sm text-gray-600">
                        Floor {room.floor}
                      </div>
                    </div>

                    {/* Price & Book Button */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          ₹{room.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">per {room.bookingType.toLowerCase()}</p>
                      </div>
                      {room.isAvailable && (
                        <Button
                          onClick={() => navigate(`/booking/${room.id}`)}
                          size="sm"
                        >
                          Book Now
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => navigate('/rooms')}
              className="px-8"
            >
              View All Rooms
            </Button>
          </div>
        </div>
      </section>

      {/* Facilities Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              World-Class Facilities
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need for a comfortable stay
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
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
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{facility.icon}</div>
                <p className="font-semibold text-gray-900">{facility.name}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Guests Say
            </h2>
            <p className="text-xl text-gray-600">
              Real experiences from real people
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Rahul Sharma',
                rating: 5,
                comment: 'Amazing experience! The rooms are clean, staff is friendly, and the location is perfect. Highly recommended!',
                avatar: '👨‍💼'
              },
              {
                name: 'Priya Patel',
                rating: 5,
                comment: 'Best hostel in the city! Great amenities, comfortable beds, and excellent service. Will definitely come back!',
                avatar: '👩‍💼'
              },
              {
                name: 'Amit Kumar',
                rating: 5,
                comment: 'Value for money! Clean rooms, good food, and helpful staff. Perfect for both short and long stays.',
                avatar: '👨‍🎓'
              }
            ].map((testimonial, index) => (
              <Card key={index} className="p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="text-4xl mr-4">{testimonial.avatar}</div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <div className="flex text-yellow-400">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.comment}"</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Book Your Stay?
          </h2>
          <p className="text-xl mb-8 text-gray-100">
            Experience comfort and hospitality at its finest. Book now and get the best rates!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/rooms')}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8"
            >
              Book Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/contact')}
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Custom Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 1s ease-out 0.3s both;
        }

        .animate-fade-in-delay-2 {
          animation: fade-in 1s ease-out 0.6s both;
        }
      `}</style>
    </div>
  )
}

export default HomePage
