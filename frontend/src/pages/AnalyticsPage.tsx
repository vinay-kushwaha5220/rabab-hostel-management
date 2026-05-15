import Card from "../components/ui/Card"

const AnalyticsPage = () => {
  const stats = [
    {
      label: "Total Bookings",
      value: "24",
      change: "+12%",
      icon: "📊",
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Total Revenue",
      value: "₹1,24,500",
      change: "+8%",
      icon: "💰",
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Occupancy Rate",
      value: "85%",
      change: "+5%",
      icon: "🏨",
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Avg Rating",
      value: "4.8/5",
      change: "+0.2",
      icon: "⭐",
      color: "bg-yellow-100 text-yellow-600",
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">View your business performance metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-sm text-green-600 font-semibold mt-2">{stat.change} from last month</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Trends */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Booking Trends</h2>
          <div className="h-64 flex items-end justify-around gap-2">
            {[65, 78, 90, 81, 56, 85, 92].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-700 hover:to-blue-500"
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-gray-600">Week {i + 1}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue Distribution */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Distribution</h2>
          <div className="space-y-4">
            {[
              { label: "Room Bookings", value: 65, color: "bg-blue-600" },
              { label: "Electricity Bills", value: 20, color: "bg-green-600" },
              { label: "Extra Charges", value: 15, color: "bg-yellow-600" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${item.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { action: "New booking created", time: "2 hours ago", icon: "📅" },
            { action: "Payment received", time: "5 hours ago", icon: "💳" },
            { action: "Room rating updated", time: "1 day ago", icon: "⭐" },
            { action: "New message from renter", time: "2 days ago", icon: "💬" },
          ].map((activity, i) => (
            <div key={i} className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-0">
              <div className="text-2xl">{activity.icon}</div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{activity.action}</p>
                <p className="text-sm text-gray-600">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default AnalyticsPage
