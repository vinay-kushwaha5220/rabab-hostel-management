import Card from "../components/ui/Card"
import Badge from "../components/ui/Badge"

interface CurrentBillTabProps {
  activeBooking: any
  monthlyRenter: any
  allBills: any[]
  validity: any
  formatDate: (date: any) => string
  onRenewClick: () => void
  onCheckoutClick: () => void
  submittingCheckout: boolean
}

export const CurrentBillTab = ({
  activeBooking,
  monthlyRenter,
  allBills,
  validity,
  formatDate,
  onRenewClick,
  onCheckoutClick,
  submittingCheckout,
}: CurrentBillTabProps) => {
  if (!activeBooking || !monthlyRenter) {
    return (
      <Card className="p-8 text-center border-none shadow-sm bg-white">
        <p className="text-gray-400 font-black text-xs uppercase tracking-widest">No active monthly stay found.</p>
      </Card>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN CONTENT - 2 COLUMNS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TOP SECTION: CURRENT MONTH RENT STATUS */}
          <Card className="p-6 border-none shadow-md bg-white rounded-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Current Month Rent Status</h2>
              </div>
              <Badge variant={validity.badgeVariant} size="sm" className="font-black text-xs uppercase">
                {validity.badgeLabel}
              </Badge>
            </div>

            {/* TOP ROW: Room, Rent, Cycle, Due Date */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-100">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Room Number</p>
                <p className="text-2xl font-black text-blue-600">{activeBooking.room?.roomNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Monthly Rent</p>
                <p className="text-2xl font-black text-gray-900">₹{(monthlyRenter?.rentAmount || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Current Cycle</p>
                <p className="text-sm font-black text-gray-900">{formatDate(validity.cycleStart)} → {formatDate(validity.cycleEnd)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Due Date</p>
                <p className="text-sm font-black text-gray-900">{validity.cycleEnd ? new Date(validity.cycleEnd).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}</p>
              </div>
            </div>

            {/* DAYS LEFT - LARGE DISPLAY */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Days Left</p>
                <p className="text-6xl font-black text-blue-600">{validity.isOverdue ? validity.overdueDays : validity.diffDays}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 font-semibold mb-2">Your rent is {validity.isOverdue ? 'overdue' : 'active'}. Pay before {validity.cycleEnd ? new Date(validity.cycleEnd).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}</p>
                {/* Cycle Progress */}
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${validity.badgeVariant === 'success' ? 'bg-green-500' : validity.badgeVariant === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${Math.min(100, Math.max(0, ((30 - validity.diffDays) / 30) * 100))}%`}}></div>
                </div>
                <p className="text-[10px] text-gray-400 font-bold mt-1">Cycle Progress: {Math.min(100, Math.max(0, Math.round(((30 - validity.diffDays) / 30) * 100)))}%</p>
              </div>
            </div>
          </Card>

          {/* MIDDLE CARDS: Payment Window, Status, Pending, Next Cycle */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Payment Window */}
            <Card className="p-4 border-none shadow-sm bg-white rounded-xl">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Payment Window</p>
              <p className="text-lg font-black text-gray-900">1st–10th</p>
              <p className="text-[9px] text-gray-500 font-semibold mt-1">of every month</p>
            </Card>

            {/* Bill Status */}
            <Card className="p-4 border-none shadow-sm bg-white rounded-xl">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Status</p>
              <Badge variant={validity.badgeVariant} size="sm" className="font-black text-xs">
                {validity.badgeLabel}
              </Badge>
              <p className="text-[9px] text-gray-500 font-semibold mt-2">Rent is {validity.isOverdue ? 'overdue' : 'active'}</p>
            </Card>

            {/* Pending Amount */}
            <Card className="p-4 border-none shadow-sm bg-white rounded-xl">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Pending Amount</p>
              <p className="text-lg font-black text-gray-900">₹{(monthlyRenter?.pendingAmount || 0).toLocaleString()}</p>
              <p className="text-[9px] text-gray-500 font-semibold mt-1">No penalty</p>
            </Card>

            {/* Next Cycle Preview */}
            <Card className="p-4 border-none shadow-sm bg-white rounded-xl">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Next Cycle Preview</p>
              <p className="text-xs font-black text-blue-600">
                {(() => {
                  const prevEnd = validity.cycleEnd || monthlyRenter.joinDate
                  const nextStart = new Date(prevEnd)
                  nextStart.setDate(nextStart.getDate() + 1)
                  const nextEnd = new Date(nextStart)
                  nextEnd.setMonth(nextEnd.getMonth() + 1)
                  nextEnd.setDate(nextEnd.getDate() - 1)
                  return `${formatDate(nextStart.toISOString())} → ${formatDate(nextEnd.toISOString())}`
                })()}
              </p>
            </Card>
          </div>

          {/* WARNING SECTIONS */}
          <div className="space-y-3">
            {/* Yellow Info Box */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
              <span className="text-xl">📋</span>
              <div>
                <p className="text-sm font-bold text-yellow-900">Pay between 1st to 10th of every month to avoid late penalty.</p>
              </div>
            </div>

            {/* Red Warning Box */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-bold text-red-900">If you pay after 10th, penalty of ₹10 per day will be added.</p>
              </div>
            </div>
          </div>

          {/* PENALTY PREVIEW CARD */}
          {validity.diffDays <= 10 && !validity.isOverdue && (
            <Card className="p-6 border-none shadow-md bg-white rounded-2xl">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Penalty Preview (If Payment After 10th)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">Today's Date</th>
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">Days After 10th</th>
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">Penalty Per Day</th>
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">Total Penalty</th>
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">Total Payable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2, 3, 4].map((day) => {
                      const daysAfter10 = day
                      const penalty = daysAfter10 * 10
                      const totalPayable = (monthlyRenter?.rentAmount || 0) + penalty
                      return (
                        <tr key={day} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-3 font-semibold text-gray-900">{new Date(new Date().getTime() + day * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                          <td className="py-3 px-3 font-semibold text-gray-900">{daysAfter10}</td>
                          <td className="py-3 px-3 font-semibold text-gray-900">₹10</td>
                          <td className="py-3 px-3 font-semibold text-red-600">₹{penalty}</td>
                          <td className="py-3 px-3 font-black text-blue-600">₹{totalPayable.toLocaleString()}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ACTIONS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={onRenewClick}
              className="p-4 bg-green-600 hover:bg-green-700 text-white font-black text-sm uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <span>⚡</span>
              <span>Renew Stay (Pay Now)</span>
            </button>
            <button 
              onClick={onCheckoutClick}
              disabled={monthlyRenter?.status === "CHECKOUT_PENDING" || monthlyRenter?.status === "CHECKED_OUT" || submittingCheckout}
              className="p-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>🏠</span>
              <span>Request Checkout</span>
            </button>
          </div>

          {/* BILLING HISTORY */}
          {allBills && allBills.length > 0 && (
            <Card className="p-6 border-none shadow-md bg-white rounded-2xl">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Recent Billing Statements</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">Cycle</th>
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">Rent Amount</th>
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">Paid Amount</th>
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">Status</th>
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">Payment Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBills.slice(0, 5).map((bill) => (
                      <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-3 font-semibold text-gray-900">{new Date(bill.month + "-01").toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                        <td className="py-3 px-3 font-semibold text-gray-900">₹{bill.rentAmount.toLocaleString()}</td>
                        <td className="py-3 px-3 font-semibold text-green-600">₹{bill.paidAmount.toLocaleString()}</td>
                        <td className="py-3 px-3">
                          <Badge variant={bill.isPaid ? 'success' : 'warning'} size="sm">
                            {bill.isPaid ? 'PAID' : 'PENDING'}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-gray-600 font-semibold">{bill.paidDate ? new Date(bill.paidDate).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

        </div>

        {/* RIGHT SIDEBAR */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* STATUS GUIDE */}
          <Card className="p-6 border-none shadow-md bg-white rounded-2xl sticky top-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Status Guide</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-xs font-bold text-gray-900">ACTIVE</p>
                  <p className="text-[10px] text-gray-500">50+ days left</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div>
                  <p className="text-xs font-bold text-gray-900">DUE SOON</p>
                  <p className="text-[10px] text-gray-500">1–10 days left</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <div>
                  <p className="text-xs font-bold text-gray-900">EXPIRES TODAY</p>
                  <p className="text-[10px] text-gray-500">Last day today</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div>
                  <p className="text-xs font-bold text-gray-900">OVERDUE</p>
                  <p className="text-[10px] text-gray-500">Expired 1+ days</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-xs font-bold text-gray-900">CHECKOUT REQUESTED</p>
                  <p className="text-[10px] text-gray-500">Pending approval</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <div>
                  <p className="text-xs font-bold text-gray-900">CHECKED OUT</p>
                  <p className="text-[10px] text-gray-500">Checkout approved</p>
                </div>
              </div>
            </div>
          </Card>

          {/* IMPORTANT RULES */}
          <Card className="p-6 border-none shadow-md bg-white rounded-2xl">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Important Rules</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-black mt-0.5">✓</span>
                <p className="text-gray-700 font-semibold">Pay between 1–10<br/>No penalty</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-black mt-0.5">✓</span>
                <p className="text-gray-700 font-semibold">Pay after 10th<br/>₹10 per day penalty</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-black mt-0.5">✓</span>
                <p className="text-gray-700 font-semibold">New cycle always starts<br/>from previous end date + 1 day</p>
              </div>
            </div>
          </Card>

          {/* HOW IT WORKS */}
          <Card className="p-6 border-none shadow-md bg-white rounded-2xl">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">How It Works</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">1</div>
                <p className="text-xs text-gray-700 font-semibold">Check your current rent status</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">2</div>
                <p className="text-xs text-gray-700 font-semibold">Plan your payment</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">3</div>
                <p className="text-xs text-gray-700 font-semibold">Pay on time (1–10)</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">4</div>
                <p className="text-xs text-gray-700 font-semibold">Cycle extends automatically</p>
              </div>
            </div>
          </Card>

        </div>

      </div>
    </div>
  )
}
