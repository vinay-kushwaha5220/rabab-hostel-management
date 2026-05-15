import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/apiV2"
import type { DashboardStats } from "../../types/dashboard"
import Card from "../../components/ui/Card"
import Badge from "../../components/ui/Badge"
import LoadingSpinner from "../../components/ui/LoadingSpinner"
import Button from "../../components/ui/Button"

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [ledgerStats, setLedgerStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const [dashboardRes, ledgerRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/monthly-bills/admin/stats")
      ])
      setStats(dashboardRes.data)
      setLedgerStats(ledgerRes.data)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading dashboard..." />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Failed to Load Dashboard</h2>
          <Button onClick={fetchDashboardStats}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Admin Console</h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Real-time overview of your property operations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Rooms */}
          <Card className="p-4 bg-white border-none shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Rooms</p>
            <div className="flex items-end gap-2">
              <span className="text-xl font-black text-slate-800">{stats.rooms.total}</span>
              <span className="text-[10px] text-gray-400 mb-1">Units</span>
            </div>
          </Card>

          {/* Available Rooms */}
          <Card className="p-4 bg-white border-none shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Available</p>
            <div className="flex items-end gap-2">
              <span className="text-xl font-black text-green-600">{stats.rooms.available}</span>
              <span className="text-[10px] text-green-400 mb-1 font-bold">Live</span>
            </div>
          </Card>

          {/* Booked Rooms */}
          <Card className="p-4 bg-white border-none shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Occupied</p>
            <div className="flex items-end gap-2">
              <span className="text-xl font-black text-red-500">{stats.rooms.booked}</span>
              <span className="text-[10px] text-red-400 mb-1 font-bold">Stay</span>
            </div>
          </Card>

          {/* Total Earnings */}
          <Card className="p-4 bg-white border-none shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Rev</p>
            <div className="flex items-end gap-1">
              <span className="text-[10px] text-blue-400 mb-1 font-bold">₹</span>
              <span className="text-xl font-black text-blue-600">{stats.earnings.total.toLocaleString()}</span>
            </div>
          </Card>
        </div>

        {/* Monthly Rent Ledger Summary */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-600 text-white p-1 rounded">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Revenue Ledger</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="p-3 bg-white border border-gray-100 shadow-sm">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Expected</p>
              <p className="text-base font-black text-gray-800">₹{ledgerStats?.totalExpected?.toLocaleString() || "0"}</p>
            </Card>
            
            <Card className="p-3 bg-white border border-gray-100 shadow-sm">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Collected</p>
              <p className="text-base font-black text-green-600">₹{ledgerStats?.totalReceived?.toLocaleString() || "0"}</p>
            </Card>

            <Card className="p-3 bg-white border border-gray-100 shadow-sm">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Outstanding</p>
              <p className="text-base font-black text-red-500">₹{ledgerStats?.remainingDues?.toLocaleString() || "0"}</p>
            </Card>

            <Card className="p-3 bg-white border border-gray-100 shadow-sm">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Paid Units</p>
              <p className="text-base font-black text-blue-500">{ledgerStats?.totalPaidRenters || "0"}</p>
            </Card>

            <Card className="p-3 bg-white border border-gray-100 shadow-sm col-span-2 md:col-span-1">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pending</p>
              <p className="text-base font-black text-orange-500">{ledgerStats?.totalPendingRenters + ledgerStats?.totalPartialRenters || "0"}</p>
            </Card>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* AC Rooms */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">AC Rooms</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rooms.ac}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">❄️</span>
              </div>
            </div>
          </Card>

          {/* Non-AC Rooms */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Non-AC Rooms</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rooms.nonAc}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🌬️</span>
              </div>
            </div>
          </Card>

          {/* Monthly Earnings */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Monthly Earnings</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.earnings.monthly.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </Card>

          {/* Pending Bookings */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Pending Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.bookings.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-none bg-white" onClick={() => navigate('/admin/bookings')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <div>
                <h3 className="text-xs font-black text-gray-800">Bookings</h3>
                <p className="text-[10px] text-gray-400 font-medium">Manage reservations</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-none bg-white" onClick={() => navigate('/admin/rooms')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              </div>
              <div>
                <h3 className="text-xs font-black text-gray-800">Inventory</h3>
                <p className="text-[10px] text-gray-400 font-medium">Manage room units</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-none bg-white" onClick={() => navigate('/admin/notifications')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {stats.unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">{stats.unreadNotifications}</span>
                )}
              </div>
              <div>
                <h3 className="text-xs font-black text-gray-800">Alerts</h3>
                <p className="text-[10px] text-gray-400 font-medium">View updates</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card className="p-0 overflow-hidden border-none shadow-sm">
          <div className="px-5 py-4 bg-white border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent Activity</h2>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/bookings')} className="text-[10px] font-black h-7">
              Full List
            </Button>
          </div>

          <div className="overflow-x-auto bg-white">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="text-left py-2.5 px-5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                  <th className="text-left py-2.5 px-5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Room</th>
                  <th className="text-right py-2.5 px-5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="text-center py-2.5 px-5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-300 text-[10px] font-bold uppercase">
                      No Records
                    </td>
                  </tr>
                ) : (
                  stats.recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5">
                        <div className="text-xs font-bold text-gray-800 leading-tight">{booking.customerName}</div>
                        <div className="text-[10px] text-blue-500 font-mono mt-0.5">{booking.bookingId}</div>
                      </td>
                      <td className="py-3 px-5">
                        {booking.room && (
                          <div className="text-xs font-medium text-gray-600">
                            Room {booking.room.roomNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right font-bold text-xs text-gray-900">
                        ₹{booking.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center justify-center gap-1.5">
                          <Badge 
                            variant={
                              booking.status === 'CONFIRMED' ? 'success' :
                              booking.status === 'PENDING' ? 'warning' :
                              booking.status === 'CANCELLED' ? 'danger' : 'secondary'
                            }
                            size="sm"
                            className="text-[8px] px-1.5 h-4"
                          >
                            {booking.status}
                          </Badge>
                          <Badge variant={booking.bookingType === 'MONTHLY' ? 'primary' : 'info'} size="sm" className="text-[8px] px-1.5 h-4">
                            {booking.bookingType === 'MONTHLY' ? 'M' : 'D'}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard
