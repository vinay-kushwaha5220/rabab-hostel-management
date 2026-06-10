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

const normalizeMonthlyRenterStatus = (status: string): string => {
  switch (status) {
    case "CHECKOUT_PENDING":
    case "CHECKOUT_REQUESTED":
      return "CHECKOUT_REQUESTED"
    case "RENEWAL_PENDING":
    case "PENDING_ADMIN_APPROVAL":
    case "STAY_CONTINUED":
    case "PENDING_PAYMENT":
      return "PAYMENT_PENDING"
    default:
      return status
  }
}

export const CurrentBillTab = ({
  activeBooking,
  monthlyRenter,
  allBills,
  validity,
  onRenewClick,
  onCheckoutClick,
  submittingCheckout,
}: CurrentBillTabProps) => {

  if (!activeBooking || !monthlyRenter) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm">
        <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No active monthly rent found.</p>
      </div>
    )
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const rentAmount   = monthlyRenter.rentAmount   || 0
  const overdueDays  = validity.overdueDays        || 0
  const isOverdue    = validity.isOverdue          || false
  const diffDays     = validity.diffDays           || 0

  // Penalty: only after 10-day grace period (overdueDays > 10)
  const penaltyDays  = overdueDays > 10 ? overdueDays - 10 : 0
  const penalty      = penaltyDays * 10
  const totalPayable = rentAmount + penalty

  // Next cycle starts exactly when the previous end cycle date is
  const nextCycleStart = (() => {
    const base = validity.cycleEnd || monthlyRenter.joinDate
    if (!base) return null
    const d = new Date(base)
    d.setUTCHours(12, 0, 0, 0)
    return d
  })()
  const nextCycleEnd = (() => {
    if (!nextCycleStart) return null
    const d = new Date(nextCycleStart)
    d.setUTCMonth(d.getUTCMonth() + 1)
    d.setUTCHours(12, 0, 0, 0)
    return d
  })()

  // Cycle progress (0–100%)
  const totalCycleDays = 30
  const daysUsed = totalCycleDays - diffDays
  const cycleProgress = Math.min(100, Math.max(0, Math.round((daysUsed / totalCycleDays) * 100)))

  const normalizedStatus = normalizeMonthlyRenterStatus(monthlyRenter.status)

  // Status badge colours
  const statusColors: Record<string, string> = {
    ACTIVE:           "bg-green-100 text-green-800 border border-green-200",
    DUE_SOON:         "bg-yellow-100 text-yellow-800 border border-yellow-200",
    EXPIRES_TODAY:    "bg-orange-100 text-orange-800 border border-orange-200",
    PAYMENT_PENDING:  "bg-orange-100 text-orange-800 border border-orange-200",
    OVERDUE:          "bg-red-100 text-red-800 border border-red-200",
    CHECKOUT_REQUESTED: "bg-blue-100 text-blue-800 border border-blue-200",
    CHECKED_OUT:      "bg-gray-100 text-gray-700 border border-gray-200",
  }
  const statusColor = statusColors[normalizedStatus] || "bg-gray-100 text-gray-700 border border-gray-200"

  const progressColor =
    normalizedStatus === "ACTIVE"          ? "bg-green-500"  :
    normalizedStatus === "DUE_SOON"        ? "bg-yellow-500" :
    normalizedStatus === "EXPIRES_TODAY"   ? "bg-orange-500" :
    isOverdue                                  ? "bg-red-500"    : "bg-blue-500"

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const fmt = (d: any) => {
    if (!d) return "N/A"
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
  }

  const fmtShort = (d: any) => {
    if (!d) return "N/A"
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-400">

      {/* ── CARD 1: CURRENT MONTH RENT STATUS ─────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header row */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Current Month Rent Status</h2>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${statusColor}`}>
            {normalizedStatus.replace(/_/g, " ")}
          </span>
        </div>

        {/* Top info row: Room · Rent · Cycle · Due Date */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-t border-gray-100">
          <div className="px-5 py-4 border-r border-gray-100">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
              <span>🏠</span> Room Number
            </p>
            <p className="text-3xl font-black text-blue-600 leading-none">{activeBooking.room?.roomNumber || "—"}</p>
          </div>
          <div className="px-5 py-4 sm:border-r border-gray-100">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
              <span>₹</span> Monthly Rent
            </p>
            <p className="text-3xl font-black text-gray-900 leading-none">₹{rentAmount.toLocaleString()}</p>
          </div>
          <div className="px-5 py-4 border-r border-t sm:border-t-0 border-gray-100">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
              <span>📅</span> Current Cycle
            </p>
            <p className="text-sm font-black text-gray-900 leading-tight">
              {validity.cycleStart && validity.cycleEnd
                ? `${fmtShort(validity.cycleStart)} → ${fmtShort(validity.cycleEnd)}`
                : monthlyRenter.joinDate
                  ? `From ${fmtShort(monthlyRenter.joinDate)}`
                  : "Not set"}
            </p>
          </div>
          <div className="px-5 py-4 border-t sm:border-t-0 border-gray-100">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
              <span>⏰</span> Due Date
            </p>
            <p className="text-sm font-black text-gray-900 leading-tight">
              {validity.cycleEnd ? fmt(validity.cycleEnd) : "Not set"}
            </p>
          </div>
        </div>

        {/* Days left + progress */}
        <div className="px-5 py-5 border-t border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                {isOverdue ? "Days Overdue" : "Days Left"}
              </p>
              <p className={`text-7xl font-black leading-none ${isOverdue ? "text-red-600" : diffDays <= 10 ? "text-yellow-500" : "text-blue-600"}`}>
                {isOverdue ? overdueDays : diffDays}
              </p>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              {validity.cycleEnd ? (
                <>
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    {isOverdue
                      ? `Rent expired ${overdueDays} day${overdueDays !== 1 ? "s" : ""} ago. Please renew or checkout.`
                      : diffDays === 0
                        ? "Rent expires today. Renew now to continue."
                        : `Your rent is active. Pay before ${fmt(validity.cycleEnd)}`}
                  </p>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${cycleProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <p className="text-[9px] text-gray-400 font-bold">Cycle Progress: {cycleProgress}%</p>
                    <p className="text-[9px] text-gray-400 font-bold">Total Days: {totalCycleDays}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400 font-semibold">Cycle dates not available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD 2: INFO STRIP (Payment Window · Status · Pending · Next Cycle) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Payment Window */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
            <span>📅</span> Payment Window
          </p>
          <p className="text-base font-black text-gray-900">1st–10th</p>
          <p className="text-[9px] text-gray-500 font-semibold mt-0.5">of every month</p>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
            <span>✅</span> Status
          </p>
          <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${statusColor}`}>
            {normalizedStatus.replace(/_/g, " ")}
          </span>
          <p className="text-[9px] text-gray-500 font-semibold mt-1.5">
            Rent is {isOverdue ? "overdue" : "active"}
          </p>
        </div>

        {/* Pending Amount */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
            <span>💰</span> Pending Amount
          </p>
          <p className="text-base font-black text-gray-900">₹{totalPayable.toLocaleString()}</p>
          <p className="text-[9px] text-gray-500 font-semibold mt-0.5">
            {penalty > 0 ? `Incl. ₹${penalty} penalty` : "No penalty"}
          </p>
        </div>

        {/* Next Cycle Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
            <span>🔄</span> Next Cycle Preview
          </p>
          <p className="text-xs font-black text-blue-600 leading-tight">
            {nextCycleStart && nextCycleEnd
              ? `${fmtShort(nextCycleStart)} → ${fmtShort(nextCycleEnd)}`
              : "—"}
          </p>
        </div>
      </div>

      {/* ── NOTICES ────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <span className="text-lg leading-none mt-0.5">ℹ️</span>
          <p className="text-sm font-semibold text-yellow-900">
            Pay between 1st to 10th of every month to avoid late penalty.
          </p>
        </div>
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <span className="text-lg leading-none mt-0.5">⚠️</span>
          <p className="text-sm font-semibold text-red-900">
            If you pay after 10th, penalty of <strong>₹10 per day</strong> will be added.
          </p>
        </div>
      </div>

      {/* ── PENALTY PREVIEW (shown when DUE_SOON / EXPIRES_TODAY / OVERDUE) ── */}
      {(diffDays <= 10 || isOverdue) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">
              Penalty Preview {isOverdue ? "(Current)" : "(If Payment After 10th)"}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-2.5 px-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Today's Date</th>
                  <th className="text-left py-2.5 px-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Days After 10th</th>
                  <th className="text-left py-2.5 px-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Penalty / Day</th>
                  <th className="text-left py-2.5 px-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Penalty</th>
                  <th className="text-left py-2.5 px-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Payable</th>
                </tr>
              </thead>
              <tbody>
                {(isOverdue
                  ? [overdueDays > 10 ? overdueDays - 10 : 0]   // show current overdue row
                  : [0, 1, 2, 3, 4]                              // show preview rows
                ).map((daysAfter10, idx) => {
                  const rowPenalty = daysAfter10 * 10
                  const rowTotal   = rentAmount + rowPenalty
                  const rowDate    = isOverdue
                    ? new Date()
                    : new Date(Date.now() + idx * 86400000)
                  return (
                    <tr key={idx} className={`border-b border-gray-50 hover:bg-gray-50 ${isOverdue ? "bg-red-50" : ""}`}>
                      <td className="py-3 px-4 font-semibold text-gray-900">{rowDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{daysAfter10}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">₹10</td>
                      <td className="py-3 px-4 font-semibold text-red-600">₹{rowPenalty}</td>
                      <td className="py-3 px-4 font-black text-blue-600">₹{rowTotal.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ACTIONS ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onRenewClick}
          className="w-full py-4 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-black text-sm uppercase tracking-wide rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <span>⚡</span>
          <span>Request Continue Stay</span>
        </button>
        <button
          onClick={onCheckoutClick}
          disabled={
            normalizedStatus === "CHECKOUT_REQUESTED" ||
            normalizedStatus === "CHECKED_OUT" ||
            submittingCheckout
          }
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm uppercase tracking-wide rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>🏠</span>
          <span>
            {normalizedStatus === "CHECKOUT_REQUESTED"
              ? "Checkout Requested"
              : "Request Checkout"}
          </span>
        </button>
      </div>
      {normalizedStatus === "CHECKOUT_REQUESTED" && (
        <p className="text-xs text-blue-600 font-semibold text-center -mt-1">
          ✅ Checkout request submitted. Awaiting admin approval.
        </p>
      )}

      {/* ── RECENT BILLING STATEMENTS ──────────────────────────────────────── */}
      {allBills && allBills.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Recent Billing Statements</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-2.5 px-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Cycle</th>
                  <th className="text-left py-2.5 px-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Rent Amount</th>
                  <th className="text-left py-2.5 px-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Paid Amount</th>
                  <th className="text-left py-2.5 px-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="text-left py-2.5 px-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Payment Date</th>
                </tr>
              </thead>
              <tbody>
                {allBills.slice(0, 5).map((bill: any) => (
                  <tr key={bill.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {new Date(bill.month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">₹{bill.rentAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 font-semibold text-green-600">₹{bill.paidAmount.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${bill.isPaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {bill.isPaid ? "PAID" : "PENDING"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-semibold">
                      {bill.paidDate ? new Date(bill.paidDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── RIGHT SIDEBAR INFO (collapsed into bottom cards on mobile) ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* Status Guide */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">Status Guide</h3>
          <div className="space-y-2.5">
            {[
              { dot: "bg-green-500",  label: "ACTIVE",            sub: "15+ days left" },
              { dot: "bg-yellow-500", label: "DUE SOON",          sub: "1–10 days left" },
              { dot: "bg-orange-500", label: "EXPIRES TODAY",     sub: "Last day today" },
              { dot: "bg-red-500",    label: "OVERDUE",           sub: "Expired 1+ days" },
              { dot: "bg-blue-500",   label: "CHECKOUT REQUESTED",sub: "Checkout pending" },
              { dot: "bg-gray-400",   label: "CHECKED OUT",       sub: "Checkout approved" },
            ].map(({ dot, label, sub }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
                <div>
                  <p className="text-[10px] font-bold text-gray-900 leading-none">{label}</p>
                  <p className="text-[9px] text-gray-400 font-medium mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Rules */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">Important Rules</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-black text-sm leading-none mt-0.5">✓</span>
              <p className="text-xs text-gray-700 font-semibold">Pay between 1–10<br /><span className="text-gray-400 font-medium">No penalty</span></p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-600 font-black text-sm leading-none mt-0.5">✓</span>
              <p className="text-xs text-gray-700 font-semibold">Pay after 10th<br /><span className="text-gray-400 font-medium">₹10 per day penalty</span></p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-black text-sm leading-none mt-0.5">✓</span>
              <p className="text-xs text-gray-700 font-semibold">New cycle starts from<br /><span className="text-gray-400 font-medium">previous end date + 1</span></p>
            </div>
            <div className="mt-3 p-2.5 bg-gray-50 rounded-lg text-[9px] text-gray-500 font-medium leading-relaxed">
              <strong className="text-gray-700">Example:</strong><br />
              Old: 16 May → 15 June<br />
              Paid on: 20 June<br />
              New: 16 June → 15 July
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">How It Works</h3>
          <div className="space-y-3">
            {[
              { n: "1", text: "Check your current rent status" },
              { n: "2", text: "Check days left in cycle" },
              { n: "3", text: "Pay on time (1–10) to avoid penalty" },
              { n: "4", text: "Cycle auto-extends from previous end date" },
            ].map(({ n, text }) => (
              <div key={n} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black flex-shrink-0">{n}</div>
                <p className="text-xs text-gray-700 font-semibold leading-tight">{text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
