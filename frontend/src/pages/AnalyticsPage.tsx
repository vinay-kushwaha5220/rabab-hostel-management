import { useEffect, useState, useMemo } from "react"
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts'
import { 
  IndianRupee, Home, Users, LayoutDashboard, Clock, 
  Banknote, ShieldCheck, Zap, Building2,
  TrendingUp, ArrowUpRight, CheckCircle2, AlertTriangle
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
  FAILED: 'FAILED',
  VERIFICATION_PENDING: 'VERIFICATION_PENDING'
} as const;

const PaymentMethod = {
  CASH: 'CASH',
  ONLINE: 'ONLINE',
  UPI: 'UPI',
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK_TRANSFER'
} as const;

const BookingTypeEnum = {
  DAILY: 'DAILY',
  MONTHLY: 'MONTHLY'
} as const;

const BillStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
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
  const [error, setError] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [bookingsRes, roomsRes, billsRes] = await Promise.all([
        api.get("/bookings"),
        api.get("/rooms"),
        billingService.getAllBills()
      ])
      setBookings(bookingsRes.data || [])
      setRooms(roomsRes.data || [])
      setBills(billsRes || [])
      setError("")
    } catch (err: any) {
      console.error('Analytics Fetch Error:', err)
      setError("Failed to generate real-time metrics. Please verify the backend API.")
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // HIGH-FIDELITY BUSINESS DATA AGGREGATION
  // ==========================================
  const stats = useMemo(() => {
    if (!rooms.length) return null

    const totalRooms = rooms.length
    
    // OCCUPANCY: Count active stay checked-in bookings to get true occupied units!
    const occupiedRooms = rooms.filter(r => 
      bookings.some(b => b.roomId === r.id && b.stayStatus === 'CHECKED_IN')
    ).length
    const availableRooms = totalRooms - occupiedRooms
    const occupancyPercentage = Math.round((occupiedRooms / (totalRooms || 1)) * 100)

    // Room Type occupancy breakdowns
    const acBooked = rooms.filter(r => r.roomType === RoomTypeEnum.AC && 
      bookings.some(b => b.roomId === r.id && b.stayStatus === 'CHECKED_IN')
    ).length
    const nonAcBooked = rooms.filter(r => r.roomType === RoomTypeEnum.NON_AC && 
      bookings.some(b => b.roomId === r.id && b.stayStatus === 'CHECKED_IN')
    ).length

    // Floor-wise occupancies
    const floor1Total = rooms.filter(r => r.floor === 1).length
    const floor2Total = rooms.filter(r => r.floor === 2).length
    const floor1Booked = rooms.filter(r => r.floor === 1 && 
      bookings.some(b => b.roomId === r.id && b.stayStatus === 'CHECKED_IN')
    ).length
    const floor2Booked = rooms.filter(r => r.floor === 2 && 
      bookings.some(b => b.roomId === r.id && b.stayStatus === 'CHECKED_IN')
    ).length

    // Active reservation counts
    const dailyBookings = bookings.filter(b => b?.bookingType === BookingTypeEnum.DAILY && b?.stayStatus === 'CHECKED_IN').length
    const monthlyBookings = bookings.filter(b => b?.bookingType === BookingTypeEnum.MONTHLY && b?.stayStatus === 'CHECKED_IN').length

    // FIXED PAYMENT LEDGER SUMS: sum payments from plural payments array correctly
    let onlinePay = 0
    let cashPay = 0
    let pendingVerifyPay = 0

    bookings.forEach(b => {
      if (b.payments && b.payments.length > 0) {
        b.payments.forEach((p: any) => {
          if (p.paymentStatus === "SUCCESS") {
            if (p.paymentMethod === "CASH") {
              cashPay += (p.amount || 0)
            } else {
              onlinePay += (p.amount || 0)
            }
          } else if (p.paymentStatus === "VERIFICATION_PENDING" || p.paymentStatus === "PENDING") {
            pendingVerifyPay += (p.amount || 0)
          }
        })
      }
    })

    // Outstanding Dues calculations
    const unpaidBillsDues = bills.filter(b => !b.isPaid).reduce((sum, b) => sum + (b.remainingAmount || 0), 0)
    const unpaidDailyDues = bookings
      .filter(b => b.bookingType === BookingTypeEnum.DAILY && b.paymentStatus === PaymentStatus.PENDING && b.status !== BookingStatus.CANCELLED)
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
    
    const pendingPay = unpaidBillsDues + unpaidDailyDues

    // Unified Bill Paid evaluator
    const isBillPaid = (bill: any) => {
      return bill.isPaid || bill.status === BillStatus.PAID || bill.status === BillStatus.PAID_ONLINE || bill.status === BillStatus.PAID_CASH
    }

    const collectedBills = bills.filter(isBillPaid).reduce((s, b) => s + (b.paidAmount || b.rentAmount || 0), 0)
    const pendingBills = bills.filter(b => !isBillPaid(b)).reduce((s, b) => s + (b.remainingAmount || b.rentAmount || 0), 0)

    // Collection trend over months
    const monthData = bills.reduce<Record<string, { month: string; Invoiced: number; Collected: number }>>((acc, bill) => {
      if (!bill || !bill.month) return acc
      
      // Format Cycle labels into a clean "Month Name" (e.g. "Cycle: 2026-05-21 to 2026-06-21" -> "May 2026")
      let displayMonth = bill.month
      if (bill.month.startsWith("Cycle: ")) {
        const parts = bill.month.replace("Cycle: ", "").split(" to ")
        if (parts.length === 2) {
          const date = new Date(parts[0])
          displayMonth = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
        }
      }
      
      acc[displayMonth] = acc[displayMonth] || { month: displayMonth, Invoiced: 0, Collected: 0 }
      acc[displayMonth].Invoiced += ((bill.rentAmount || 0) + (bill.electricityAmount || 0) + (bill.extraCharges || 0))
      acc[displayMonth].Collected += (bill.paidAmount || 0)
      
      return acc
    }, {})

    // Sort months cronologically
    const collectionTrend = Object.values(monthData).sort((a: any, b: any) => {
      const parseDate = (mStr: string) => {
        const d = new Date(mStr)
        return isNaN(d.getTime()) ? 0 : d.getTime()
      }
      return parseDate(a.month) - parseDate(b.month)
    })

    return {
      totalRooms, occupiedRooms, availableRooms, occupancyPercentage,
      acBooked, nonAcBooked,
      floor1Total, floor2Total,
      floor1Booked, floor2Booked,
      dailyBookings, monthlyBookings,
      onlinePay, cashPay, pendingVerifyPay, pendingPay,
      collectedBills, pendingBills,
      collectionTrend
    }
  }, [rooms, bookings, bills])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">Generating Business Intelligence...</h2>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-8 max-w-sm text-center shadow-lg">
          <span className="text-3xl">⚠️</span>
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mt-2">Data Load Failed</h3>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">Failed to collect analytics. Please double-check SQLite connections.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/40 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Block */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 text-white">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              Analytics & Operations Panel
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Interactive financial trajectory charts, occupancy densities, floor audits, and settlement statistics
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200/60 shadow-sm self-start md:self-auto">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Real-time Sync</span>
            </div>
            <Badge variant="success" className="text-[8px] font-extrabold uppercase rounded-lg px-2 py-0.5">Active</Badge>
          </div>
        </div>

        {/* Global Error Notification */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-semibold text-rose-700 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* High-Impact Stat Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Occupancy Density */}
          <PremiumStatCard 
            label="Occupancy Rate" 
            value={`${stats.occupiedRooms} / ${stats.totalRooms}`} 
            subValue={`${stats.availableRooms} Units Available`}
            icon={<Home className="w-5 h-5 text-indigo-600" />}
            progress={stats.occupancyPercentage}
            color="indigo"
          />

          {/* Card 2: Confirmed Stays */}
          <PremiumStatCard 
            label="Staying Residents" 
            value={stats.occupiedRooms} 
            subValue="Actively Checked In"
            icon={<Users className="w-5 h-5 text-emerald-600" />}
            trend={`${stats.occupancyPercentage}% Occupied`}
            color="emerald"
          />

          {/* Card 3: Total Collections */}
          <PremiumStatCard 
            label="Total Collected" 
            value={`₹${(stats.onlinePay + stats.cashPay).toLocaleString()}`} 
            subValue={`₹${stats.pendingPay.toLocaleString()} Dues Pending`}
            icon={<IndianRupee className="w-5 h-5 text-blue-600" />}
            trend={`₹${stats.pendingVerifyPay.toLocaleString()} In-Review`}
            color="blue"
          />

          {/* Card 4: Bills Success Rate */}
          <PremiumStatCard 
            label="Rent Invoiced Success" 
            value={`₹${stats.collectedBills.toLocaleString()}`} 
            subValue={`${Math.round((stats.collectedBills / (stats.collectedBills + stats.pendingBills || 1)) * 100)}% Collection Rate`}
            icon={<ShieldCheck className="w-5 h-5 text-purple-600" />}
            progress={(stats.collectedBills / (stats.collectedBills + stats.pendingBills || 1)) * 100}
            color="purple"
          />
        </div>

        {/* Chart Rows Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart 1: Revenue Invoiced vs Collected AreaChart */}
          <Card className="lg:col-span-2 p-6 border border-slate-150 shadow-sm bg-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-100/50 transition-all duration-500"></div>
            <div className="flex justify-between items-start mb-6 relative">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">Financial Trajectory</h2>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Invoiced Rent vs Collected Dues</p>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5" />
                Operational Ledger
              </div>
            </div>
            
            <div className="h-[280px] w-full mt-4">
              {stats.collectionTrend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 uppercase font-black tracking-widest text-[9px]">
                  📊 Waiting for billing cycles data...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.collectionTrend}>
                    <defs>
                      <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', fontSize: '11px', fontWeight: 700}}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: 800, textTransform: 'uppercase'}} />
                    <Area name="Invoiced Volume" type="monotone" dataKey="Invoiced" stroke="#818cf8" strokeWidth={3.5} fillOpacity={1} fill="url(#colorInvoiced)" />
                    <Area name="Collected Amount" type="monotone" dataKey="Collected" stroke="#10b981" strokeWidth={3.5} fillOpacity={1} fill="url(#colorCollected)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Chart 2: Unit Density Doughnut Chart */}
          <Card className="p-6 border border-slate-150 shadow-sm bg-white group flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">Unit Density</h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Hostel Room Occupancy</p>
            </div>
            
            <div className="h-[200px] w-full relative mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Occupied', value: stats.occupiedRooms },
                      { name: 'Empty', value: stats.availableRooms }
                    ]}
                    innerRadius={55}
                    outerRadius={75}
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
                <p className="text-2xl font-black text-slate-900 leading-none">
                  {stats.occupancyPercentage}%
                </p>
                <p className="text-[8px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Occupancy</p>
              </div>
            </div>
            
            <div className="space-y-3 mt-4 border-t border-slate-50 pt-4">
              <DensityRow label="AC Rooms Occupied" count={stats.acBooked} color="#6366f1" />
              <DensityRow label="Non-AC Rooms Occupied" count={stats.nonAcBooked} color="#94a3b8" />
            </div>
          </Card>
        </div>

        {/* Settlement Channels & Performance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Settlement Channels */}
          <Card className="p-6 border border-slate-150 shadow-sm bg-white space-y-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">Settlement Channels</h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Fully Verified Transaction splits</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ChannelCard label="Online Receipts" amount={stats.onlinePay} icon={<Zap className="w-3.5 h-3.5" />} color="emerald" />
              <ChannelCard label="Cash Collected" amount={stats.cashPay} icon={<Banknote className="w-3.5 h-3.5" />} color="blue" />
              <div className="col-span-2">
                <ChannelCard label="Outstanding Receivables" amount={stats.pendingPay} icon={<Clock className="w-3.5 h-3.5" />} color="orange" />
              </div>
            </div>
          </Card>

          {/* Floor Performance */}
          <Card className="p-6 border border-slate-150 shadow-sm bg-white space-y-6">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">Floor Performance</h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Floor-wise unit occupancies</p>
            </div>
            <div className="space-y-5">
              <FloorRow floor="1st Floor" booked={stats.floor1Booked} total={stats.floor1Total || 13} color="indigo" />
              <FloorRow floor="2nd Floor" booked={stats.floor2Booked} total={stats.floor2Total || 13} color="blue" />
            </div>
          </Card>

          {/* Stay Type Dynamics */}
          <Card className="p-6 border border-slate-150 shadow-sm bg-white space-y-6">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">Stay Type Dynamics</h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Stays contract distribution</p>
            </div>
            <div className="flex flex-col h-[calc(100%-48px)] justify-around py-1">
              <StayRow label="Monthly Rent Cycles" count={stats.monthlyBookings} icon={<Building2 className="w-4 h-4 text-indigo-500" />} />
              <div className="h-px bg-slate-100 w-full my-2"></div>
              <StayRow label="Daily Bookings" count={stats.dailyBookings} icon={<Clock className="w-4 h-4 text-emerald-500" />} />
            </div>
          </Card>

        </div>

      </div>
    </div>
  )
}

// ==========================================
// STUNNING REUSABLE LEDGER SUB-COMPONENTS
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
    indigo: "bg-indigo-50 text-indigo-600 border border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border border-blue-100",
    purple: "bg-purple-50 text-purple-600 border border-purple-100",
    orange: "bg-orange-50 text-orange-600 border border-orange-100",
  }
  return (
    <Card className="p-5 border border-slate-150 shadow-sm bg-white hover:-translate-y-0.5 transition-all duration-300 group flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2.5 rounded-xl ${colorMap[color]} group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {trend}
            </div>
          )}
        </div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">{label}</p>
        <p className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">{value}</p>
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter leading-none">{subValue}</p>
      </div>
      {progress !== undefined && (
        <div className="mt-4 h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
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
  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
      <span className="uppercase tracking-tight text-[10px]">{label}</span>
    </div>
    <span className="text-slate-900 font-extrabold font-mono">{count} Units Occupied</span>
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
    emerald: "bg-emerald-50 text-emerald-650 border-emerald-100",
    blue: "bg-blue-50 text-blue-650 border-blue-100",
    orange: "bg-orange-50 text-orange-655 border-orange-100",
  }
  return (
    <div className={`p-4 rounded-2xl border ${colorMap[color]} transition-all hover:shadow-sm flex flex-col justify-between`}>
      <div className="flex items-center gap-1.5 mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-base font-black text-slate-900 tracking-tight leading-none font-mono">₹{amount.toLocaleString()}</p>
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
  <div className="group space-y-1">
    <div className="flex justify-between items-end text-xs font-bold text-slate-500">
      <div className="flex items-center gap-1.5 leading-none">
        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">Scope</span>
        <span className="text-sm text-slate-900 font-extrabold">{floor}</span>
      </div>
      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-600">{booked} / {total} Active Units</span>
    </div>
    <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
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
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-all duration-300 text-slate-500`}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-black text-slate-900 leading-none">{count} Active Stays</p>
      </div>
    </div>
    <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors" />
  </div>
)

export default AnalyticsPage
