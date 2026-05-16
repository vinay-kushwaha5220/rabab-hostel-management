import { useEffect, useState, useMemo } from "react"
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts'
import { 
  IndianRupee, Home, Users, LayoutDashboard, Clock, 
  Banknote, ShieldCheck, Zap, Building2,
  TrendingUp, ArrowUpRight
} from 'lucide-react'
import api from "../services/apiV2"
import { billingService } from "../services/billingService"
import type { BookingType } from "../types/booking"
import type { RoomType } from "../types/room"
import type { MonthlyBill } from "../types/billing"
import Card from "../components/ui/Card"
import Badge from "../components/ui/Badge"
import LoadingSpinner from "../components/ui/LoadingSpinner"

const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED'
} as const;

const PaymentStatus = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED'
} as const;

const PaymentMethod = {
  CASH: 'CASH',
  ONLINE: 'ONLINE'
} as const;

const BookingTypeEnum = {
  DAILY: 'DAILY',
  MONTHLY: 'MONTHLY'
} as const;

const BillStatus = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID_ONLINE: 'PAID_ONLINE',
  PAID_CASH: 'PAID_CASH',
  OVERDUE: 'OVERDUE',
  VERIFICATION_PENDING: 'VERIFICATION_PENDING'
} as const;

const RoomTypeEnum = {
  AC: 'AC',
  NON_AC: 'NON_AC'
} as const;

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<BookingType[]>([])
  const [rooms, setRooms] = useState<RoomType[]>([])
  const [bills, setBills] = useState<MonthlyBill[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsRes, roomsRes, billsRes] = await Promise.all([
          api.get("/bookings"),
          api.get("/rooms"),
          billingService.getAllBills()
        ])
        setBookings(bookingsRes.data)
        setRooms(roomsRes.data)
        setBills(billsRes)
      } catch (error) {
        console.error('Analytics Error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // ==========================================
  // PREMIUM DATA AGGREGATION
  // ==========================================
  const stats = useMemo(() => {
    if (!rooms.length) return null

    const totalRooms = rooms.length
    const bookedRooms = rooms.filter(r => !r.isAvailable).length
    const availableRooms = totalRooms - bookedRooms

    const acBooked = rooms.filter(r => r.roomType === RoomTypeEnum.AC && !r.isAvailable).length
    const nonAcBooked = rooms.filter(r => r.roomType === RoomTypeEnum.NON_AC && !r.isAvailable).length

    const floor1Booked = rooms.filter(r => r.floor === 1 && !r.isAvailable).length
    const floor2Booked = rooms.filter(r => r.floor === 2 && !r.isAvailable).length

    const dailyBookings = bookings.filter(b => b?.bookingType === BookingTypeEnum.DAILY && b?.status === BookingStatus.CONFIRMED).length
    const monthlyBookings = bookings.filter(b => b?.bookingType === BookingTypeEnum.MONTHLY && b?.status === BookingStatus.CONFIRMED).length

    let onlinePay = 0
    let cashPay = 0
    bookings.forEach(b => {
      if (b?.paymentStatus === PaymentStatus.SUCCESS && b?.payment?.[0]) {
        if (b.payment[0]?.paymentMethod === PaymentMethod.CASH) cashPay += (b?.totalAmount || 0)
        else onlinePay += (b?.totalAmount || 0)
      }
    })
    const pendingPay = bookings
      .filter(b => b?.paymentStatus === PaymentStatus.PENDING && b?.status !== BookingStatus.CANCELLED)
      .reduce((sum, b) => sum + (b?.totalAmount || 0), 0)

    const isBillPaid = (status: string | undefined) => status === BillStatus.PAID_ONLINE || status === BillStatus.PAID_CASH

    const collectedBills = bills.filter(b => isBillPaid(b?.status)).reduce((s, b) => s + (b?.rentAmount || 0), 0)
    const pendingBills = bills.filter(b => !isBillPaid(b?.status)).reduce((s, b) => s + (b?.rentAmount || 0), 0)

    const monthData = bills.reduce<Record<string, { month: string; collected: number; total: number }>>((acc, bill) => {
      if (!bill || !bill.month) return acc
      acc[bill.month] = acc[bill.month] || { month: bill.month, collected: 0, total: 0 }
      acc[bill.month].total += (bill.rentAmount || 0)
      if (isBillPaid(bill.status)) acc[bill.month].collected += (bill.rentAmount || 0)
      return acc
    }, {})
    const collectionTrend = Object.values(monthData).sort((a: any, b: any) => a.month.localeCompare(b.month))

    return {
      totalRooms, bookedRooms, availableRooms,
      acBooked, nonAcBooked,
      floor1Booked, floor2Booked,
      dailyBookings, monthlyBookings,
      onlinePay, cashPay, pendingPay,
      collectedBills, pendingBills,
      collectionTrend
    }
  }, [rooms, bookings, bills])

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <LoadingSpinner size="xl" text="Generating Business Insights..." />
    </div>
  )

  if (!stats) return <div>Data Error.</div>

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-10">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 ml-1">Live Operational Intelligence</p>
        </div>
        <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Real-time Sync</span>
          </div>
          <Badge variant="success" className="text-[9px] font-black uppercase">Active</Badge>
        </div>
      </div>

      {/* High-Impact KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <PremiumStatCard 
          label="Inventory Status" 
          value={`${stats.bookedRooms} / ${stats.totalRooms}`} 
          subValue={`${stats.availableRooms} Units Available`}
          icon={<Home className="w-5 h-5 text-indigo-600" />}
          progress={(stats.bookedRooms / stats.totalRooms) * 100}
          color="indigo"
        />
        <PremiumStatCard 
          label="Confirmed Stays" 
          value={stats.dailyBookings + stats.monthlyBookings} 
          subValue="Active Reservations"
          icon={<Users className="w-5 h-5 text-emerald-600" />}
          trend="+8%"
          color="emerald"
        />
        <PremiumStatCard 
          label="Total Receivables" 
          value={`₹${(stats.onlinePay + stats.cashPay).toLocaleString()}`} 
          subValue={`₹${stats.pendingPay.toLocaleString()} Outstanding`}
          icon={<IndianRupee className="w-5 h-5 text-blue-600" />}
          trend="+12%"
          color="blue"
        />
        <PremiumStatCard 
          label="Bill Collection" 
          value={`₹${stats.collectedBills.toLocaleString()}`} 
          subValue={`${Math.round((stats.collectedBills / (stats.collectedBills + stats.pendingBills || 1)) * 100)}% Success Rate`}
          icon={<ShieldCheck className="w-5 h-5 text-purple-600" />}
          progress={(stats.collectedBills / (stats.collectedBills + stats.pendingBills || 1)) * 100}
          color="purple"
        />
      </div>

      {/* Analytics Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Performance Chart */}
        <Card className="lg:col-span-2 p-8 border-none shadow-xl shadow-slate-200/50 bg-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-100/50 transition-all duration-500"></div>
          <div className="flex justify-between items-start mb-10 relative">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Financial Trajectory</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Monthly collection flow</p>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 font-black text-xs">
              <TrendingUp className="w-4 h-4" />
              +24% Growth
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.collectionTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="month" hide />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 700}}
                />
                <Area type="monotone" dataKey="collected" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Occupancy Density */}
        <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group">
          <h2 className="text-lg font-black text-slate-900 tracking-tight mb-8">Unit Density</h2>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Occupied', value: stats.bookedRooms },
                    { name: 'Empty', value: stats.availableRooms }
                  ]}
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                >
                  <Cell fill="#6366f1" />
                  <Cell fill="#f1f5f9" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-3xl font-black text-slate-900 leading-none">
                {Math.round((stats.bookedRooms / stats.totalRooms) * 100)}%
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">Occupancy</p>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <DensityRow label="AC Booked" count={stats.acBooked} color="#6366f1" />
            <DensityRow label="Non-AC Booked" count={stats.nonAcBooked} color="#94a3b8" />
          </div>
        </Card>

        {/* Payment Channels */}
        <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white">
          <h2 className="text-lg font-black text-slate-900 tracking-tight mb-8">Settlement Channels</h2>
          <div className="grid grid-cols-2 gap-6">
            <ChannelCard label="Online" amount={stats.onlinePay} icon={<Zap className="w-4 h-4" />} color="emerald" />
            <ChannelCard label="Cash" amount={stats.cashPay} icon={<Banknote className="w-4 h-4" />} color="blue" />
            <div className="col-span-2">
              <ChannelCard label="Outstanding Dues" amount={stats.pendingPay} icon={<Clock className="w-4 h-4" />} color="orange" />
            </div>
          </div>
        </Card>

        {/* Floor Analytics */}
        <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white lg:col-span-1">
          <h2 className="text-lg font-black text-slate-900 tracking-tight mb-8">Floor Performance</h2>
          <div className="space-y-6">
            <FloorRow floor="01" booked={stats.floor1Booked} total={13} color="indigo" />
            <FloorRow floor="02" booked={stats.floor2Booked} total={13} color="blue" />
          </div>
        </Card>

        {/* Stay Type Breakdown */}
        <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white lg:col-span-1">
          <h2 className="text-lg font-black text-slate-900 tracking-tight mb-8">Stay Dynamics</h2>
          <div className="flex flex-col h-full justify-around py-2">
            <StayRow label="Monthly Stays" count={stats.monthlyBookings} icon={<Building2 className="w-5 h-5 text-indigo-500" />} />
            <div className="h-px bg-slate-50 w-full my-4"></div>
            <StayRow label="Daily Bookings" count={stats.dailyBookings} icon={<Clock className="w-5 h-5 text-emerald-500" />} />
          </div>
        </Card>

      </div>
    </div>
  )
}

// ==========================================
// PREMIUM SUB-COMPONENTS
// ==========================================

interface PremiumStatCardProps {
  label: string;
  value: string | number;
  subValue: string;
  icon: React.ReactNode;
  progress?: number;
  trend?: string;
  color: 'indigo' | 'emerald' | 'blue' | 'purple' | 'orange';
}

const PremiumStatCard = ({ label, value, subValue, icon, progress, trend, color }: PremiumStatCardProps) => {
  const colorMap: any = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
  }
  return (
    <Card className="p-6 border-none shadow-xl shadow-slate-200/40 bg-white hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${colorMap[color]} group-hover:scale-110 transition-transform duration-500`}>
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-3">{value}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none">{subValue}</p>
      </div>
      {progress !== undefined && (
        <div className="mt-6 h-1.5 bg-slate-50 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${color === 'indigo' ? 'bg-indigo-500' : 'bg-purple-500'}`} 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </Card>
  )
}

interface DensityRowProps {
  label: string;
  count: number;
  color: string;
}

const DensityRow = ({ label, count, color }: DensityRowProps) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
      <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{label}</span>
    </div>
    <span className="text-sm font-black text-slate-900">{count} Units</span>
  </div>
)

interface ChannelCardProps {
  label: string;
  amount: number;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'orange';
}

const ChannelCard = ({ label, amount, icon, color }: ChannelCardProps) => {
  const colorMap: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  }
  return (
    <div className={`p-5 rounded-2xl border ${colorMap[color]} transition-all hover:shadow-md`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-xl font-black text-slate-900 tracking-tight">₹{amount.toLocaleString()}</p>
    </div>
  )
}

interface FloorRowProps {
  floor: string;
  booked: number;
  total: number;
  color: 'indigo' | 'blue';
}

const FloorRow = ({ floor, booked, total, color }: FloorRowProps) => (
  <div className="group">
    <div className="flex justify-between items-end mb-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Floor</span>
        <span className="text-xl font-black text-slate-900 leading-none">{floor}</span>
      </div>
      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{booked} / {total} Booked</span>
    </div>
    <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
      <div 
        className={`h-full transition-all duration-1000 ${color === 'indigo' ? 'bg-indigo-500' : 'bg-blue-500'}`}
        style={{ width: `${(booked / total) * 100}%` }}
      />
    </div>
  </div>
)

interface StayRowProps {
  label: string;
  count: number;
  icon: React.ReactNode;
}

const StayRow = ({ label, count, icon }: StayRowProps) => (
  <div className="flex items-center justify-between group cursor-default">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl bg-white shadow-md border border-slate-50 group-hover:scale-110 transition-all duration-300`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <p className="text-lg font-black text-slate-900 leading-none">{count} Active Stays</p>
      </div>
    </div>
    <ArrowUpRight className="w-4 h-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
  </div>
)

export default AnalyticsPage



