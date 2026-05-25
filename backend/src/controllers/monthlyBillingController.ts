import type { Request, Response } from "express"
import prisma from "../config/prisma.js"
import type { AuthRequest } from "../middleware/authMiddleware.js"
import { MonthlyBillStatus, VerificationStatus, PaymentStatus, PaymentMethod, NotificationType, NotificationPriority, UserRole, BookingStatus, StayStatus, MonthlyRenterStatus, RenewalRequestStatus, RenewalRequestType, BookingType } from "@prisma/client"
import { runAutomaticBillingReminders } from "../services/schedulerService.js"

// ==========================================
// SYNC THROTTLE — prevent running expensive
// syncAllRenterOverdueStatuses on every API call
// Only runs at most once every 5 minutes
// ==========================================
let lastSyncTime: number = 0
const SYNC_THROTTLE_MS = 5 * 60 * 1000 // 5 minutes

const throttledSyncOverdueStatuses = async () => {
  const now = Date.now()
  // Bypass throttle during testing
  // if (now - lastSyncTime < SYNC_THROTTLE_MS) {
  //   return // Skip — recently synced
  // }
  lastSyncTime = now
  await syncAllRenterOverdueStatuses()
}

// ==========================================
// CREATE MONTHLY BILL (Admin)
// ==========================================
export const createMonthlyBill = async (req: AuthRequest, res: Response) => {
  console.log("🚀 createMonthlyBill controller HIT with body:", req.body)
  try {
    let { bookingId, month, rentAmount, electricityAmount, extraCharges, dueDate } = req.body

    // Ensure numeric values are numbers
    bookingId = parseInt(String(bookingId))
    rentAmount = parseFloat(String(rentAmount))
    electricityAmount = parseFloat(String(electricityAmount || 0))
    extraCharges = parseFloat(String(extraCharges || 0))

    if (isNaN(bookingId) || !month || isNaN(rentAmount) || !dueDate) {
      return res.status(400).json({
        message: "Valid bookingId, month, rentAmount, and dueDate are required",
      })
    }

    // Try to find booking by numeric ID or by the bookingId string
    let booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    })

    // If not found by numeric ID, try searching by the bookingId string (e.g., "RBS-2026-001")
    if (!booking) {
      booking = await prisma.booking.findUnique({
        where: { bookingId: String(req.body.bookingId) },
        include: { user: true },
      })
    }

    if (!booking) {
      return res.status(422).json({
        message: `Booking not found for ID or Code: ${req.body.bookingId}. Please check your database for this ID.`,
      })
    }

    // Ensure we use the correct numeric ID for the rest of the operation
    const actualBookingId = booking.id;
    bookingId = actualBookingId;

    // Check if bill already exists for this month
    const existingBill = await prisma.monthlyBill.findFirst({
      where: {
        bookingId,
        month,
      },
    })

    if (existingBill) {
      return res.status(400).json({
        message: "A bill already exists for this booking in the selected month",
      })
    }

    // Calculate totals and dues
    const currentMonthTotal = rentAmount + (electricityAmount || 0) + (extraCharges || 0)
    
    // Find previous month's bill to get remaining dues
    const previousBill = await prisma.monthlyBill.findFirst({
      where: {
        bookingId: actualBookingId,
      },
      orderBy: {
        month: 'desc'
      }
    })

    const previousDue = previousBill ? previousBill.remainingAmount : 0
    const totalDue = currentMonthTotal + previousDue
    const remainingAmount = totalDue // Initially full amount is remaining

    // Create monthly bill
    const bill = await prisma.monthlyBill.create({
      data: {
        bookingId: actualBookingId,
        month,
        rentAmount,
        electricityAmount: electricityAmount || 0,
        extraCharges: extraCharges || 0,
        totalAmount: currentMonthTotal,
        previousDue,
        totalDue,
        paidAmount: 0,
        remainingAmount,
        dueDate: new Date(dueDate),
        status: MonthlyBillStatus.PENDING,
        verificationStatus: VerificationStatus.PENDING,
      },
      include: {
        booking: {
          include: {
            user: true,
            room: true,
          },
        },
      },
    })

    // Create notification for renter
    await prisma.notification.create({
      data: {
        bookingId: actualBookingId,
        title: "Monthly Bill Added",
        message: `Your monthly bill for ${month} has been added. Total due: ₹${totalDue}`,
        type: NotificationType.BILL,
        priority: NotificationPriority.MEDIUM,
      },
    })

    console.log(`✅ Monthly bill created for booking ${bookingId}`)

    res.status(201).json({
      message: "Monthly bill created successfully",
      bill,
    })
  } catch (error) {
    console.error("Create monthly bill error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GENERATE BULK MONTHLY BILLS (Admin)
// ==========================================
export const generateBulkMonthlyBills = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.body
    if (!month || !year) {
      return res.status(400).json({ message: "Month and Year are required" })
    }

    const targetMonth = `${month} ${year}`
    
    // 1. Get all active monthly renters
    const activeBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        stayStatus: StayStatus.CHECKED_IN,
        room: {
          bookingType: "MONTHLY"
        }
      },
      include: {
        room: true,
        monthlyBills: {
          where: { month: targetMonth }
        }
      }
    })

    let createdCount = 0
    let skippedCount = 0

    for (const booking of activeBookings) {
      // Skip if bill already exists for this month
      if (booking.monthlyBills.length > 0) {
        skippedCount++
        continue
      }

      const rentAmount = booking.room.monthlyPrice || booking.room.price
      
      // Get previous dues
      const lastBill = await prisma.monthlyBill.findFirst({
        where: { bookingId: booking.id },
        orderBy: { createdAt: 'desc' }
      })
      
      const previousDue = lastBill ? lastBill.remainingAmount : 0
      const totalAmount = rentAmount // Starting with just rent for auto-gen
      const totalDue = totalAmount + previousDue
      
      // Default due date: 5th of the month
      const dueDate = new Date()
      dueDate.setDate(5)
      if (dueDate < new Date()) {
        dueDate.setMonth(dueDate.getMonth() + 1)
      }

      await prisma.monthlyBill.create({
        data: {
          bookingId: booking.id,
          month: targetMonth,
          rentAmount,
          electricityAmount: 0,
          extraCharges: 0,
          totalAmount,
          previousDue,
          totalDue,
          paidAmount: 0,
          remainingAmount: totalDue,
          dueDate,
          status: MonthlyBillStatus.PENDING,
          verificationStatus: VerificationStatus.PENDING,
        }
      })

      // Notify
      await prisma.notification.create({
        data: {
          bookingId: booking.id,
          title: `Rent Invoice: ${targetMonth}`,
          message: `Your monthly rent bill for ${targetMonth} has been generated. Amount: ₹${totalDue}`,
          type: NotificationType.BILL,
          priority: NotificationPriority.HIGH
        }
      })

      createdCount++
    }

    res.status(200).json({ 
      message: `Processing complete. Generated: ${createdCount}, Skipped: ${skippedCount}`,
      createdCount,
      skippedCount
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// ==========================================
// GET MONTHLY BILL (Renter/Admin)
// ==========================================
export const getMonthlyBill = async (req: AuthRequest, res: Response) => {
  try {
    const { billId } = req.params
    const userId = Number(req.userId)

    const bill = await prisma.monthlyBill.findUnique({
      where: { id: parseInt(String(billId)) },
      include: {
        booking: {
          include: {
            user: true,
            room: true,
          },
        },
        payments: true,
      },
    })

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      })
    }

    // Check authorization
    if (bill.booking.user.id !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })
      if (user?.role !== UserRole.ADMIN) {
        return res.status(403).json({
          message: "Unauthorized",
        })
      }
    }

    res.status(200).json(bill)
  } catch (error) {
    console.error("Get monthly bill error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET RENTER'S MONTHLY BILLS
// ==========================================
export const getRenterMonthlyBills = async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.userId)

    const bills = await prisma.monthlyBill.findMany({
      where: {
        booking: {
          userId,
        },
      },
      include: {
        booking: {
          include: {
            room: true,
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.status(200).json(bills)
  } catch (error) {
    console.error("Get renter monthly bills error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET ALL MONTHLY BILLS (Admin)
// ==========================================
export const getAllMonthlyBills = async (req: AuthRequest, res: Response) => {
  try {
    // Sync all renter overdue states first
    await throttledSyncOverdueStatuses()

    const { status, month, year, roomNumber } = req.query

    const where: any = {
      isDeleted: false
    }

    if (status) {
      if (status === "PAID") {
        where.status = { in: [MonthlyBillStatus.PAID_ONLINE, MonthlyBillStatus.PAID_CASH] }
      } else {
        where.status = status as MonthlyBillStatus
      }
    }

    if (month) {
      // If month is just a name like "January", we might need to handle year too
      if (year) {
        where.month = `${month} ${year}`
      } else {
        where.month = { contains: String(month) }
      }
    } else if (year) {
      where.month = { contains: String(year) }
    }

    if (roomNumber) {
      where.booking = {
        room: {
          roomNumber: String(roomNumber)
        }
      }
    }

    // AUTO OVERDUE SYSTEM: Check and update status for all pending bills before returning
    const now = new Date()
    await prisma.monthlyBill.updateMany({
      where: {
        status: { in: [MonthlyBillStatus.PENDING, MonthlyBillStatus.PARTIAL] },
        dueDate: { lt: now },
        isPaid: false
      },
      data: {
        status: MonthlyBillStatus.OVERDUE
      }
    })

    const bills = await prisma.monthlyBill.findMany({
      where,
      include: {
        booking: {
          include: {
            user: true,
            room: true,
            monthlyRenter: true,
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.status(200).json(bills)
  } catch (error) {
    console.error("Get all monthly bills error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// UPDATE MONTHLY BILL (Admin)
// ==========================================
export const updateMonthlyBill = async (req: AuthRequest, res: Response) => {
  try {
    const { billId } = req.params
    const { rentAmount, electricityAmount, extraCharges, dueDate } = req.body

    const bill = await prisma.monthlyBill.findUnique({
      where: { id: parseInt(String(billId)) },
    })

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      })
    }

    const totalAmount =
      (rentAmount || bill.rentAmount) +
      (electricityAmount || bill.electricityAmount) +
      (extraCharges || bill.extraCharges)

    const updatedBill = await prisma.monthlyBill.update({
      where: { id: parseInt(String(billId)) },
      data: {
        rentAmount: rentAmount || bill.rentAmount,
        electricityAmount: electricityAmount || bill.electricityAmount,
        extraCharges: extraCharges || bill.extraCharges,
        totalAmount,
        dueDate: dueDate ? new Date(dueDate) : bill.dueDate,
      },
      include: {
        booking: {
          include: {
            user: true,
            room: true,
          },
        },
        payments: true,
      },
    })

    console.log(`✅ Monthly bill updated: ${billId}`)

    res.status(200).json({
      message: "Monthly bill updated successfully",
      bill: updatedBill,
    })
  } catch (error) {
    console.error("Update monthly bill error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// DELETE MONTHLY BILL (Admin)
// ==========================================
export const deleteMonthlyBill = async (req: AuthRequest, res: Response) => {
  try {
    const { billId } = req.params

    const bill = await prisma.monthlyBill.findUnique({
      where: { id: parseInt(String(billId)) },
    })

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      })
    }

    await prisma.monthlyBill.delete({
      where: { id: parseInt(String(billId)) },
    })

    console.log(`✅ Monthly bill deleted: ${billId}`)

    res.status(200).json({
      message: "Monthly bill deleted successfully",
    })
  } catch (error) {
    console.error("Delete monthly bill error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET RENTER DASHBOARD DATA
// ==========================================
// VERIFY MONTHLY PAYMENT (ADMIN)
// ==========================================
export const verifyMonthlyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { billId } = req.params
    const { amount, paymentMethod = PaymentMethod.CASH, transactionId } = req.body
    const numericBillId = Number(billId)

    if (isNaN(numericBillId)) {
      return res.status(400).json({ message: "Invalid bill ID" })
    }

    const bill = await prisma.monthlyBill.findUnique({
      where: { id: numericBillId },
      include: { booking: true }
    })

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" })
    }

    const paymentAmount = amount ? parseFloat(amount) : bill.remainingAmount
    const newPaidAmount = bill.paidAmount + paymentAmount
    const newRemainingAmount = Math.max(0, bill.totalDue - newPaidAmount)
    
    let newStatus: MonthlyBillStatus = MonthlyBillStatus.PARTIAL
    if (newRemainingAmount <= 0) {
      newStatus = paymentMethod === PaymentMethod.CASH ? MonthlyBillStatus.PAID_CASH : MonthlyBillStatus.PAID_ONLINE
    }

    // Update bill
    await prisma.monthlyBill.update({
      where: { id: numericBillId },
      data: {
        isPaid: newRemainingAmount <= 0,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        paidDate: newRemainingAmount <= 0 ? new Date() : bill.paidDate,
        status: newStatus,
        verificationStatus: VerificationStatus.VERIFIED,
      },
    })

    // Fix Payment Double Logging: check for existing pending payment record
    const pendingPayment = await prisma.payment.findFirst({
      where: {
        monthlyBillId: numericBillId,
        paymentStatus: PaymentStatus.PENDING
      }
    })

    if (pendingPayment) {
      await prisma.payment.update({
        where: { id: pendingPayment.id },
        data: {
          paymentStatus: PaymentStatus.SUCCESS,
          verificationStatus: VerificationStatus.VERIFIED,
          transactionId: transactionId || pendingPayment.transactionId || `VERIFIED-${Date.now()}`,
          paymentMethod: paymentMethod as PaymentMethod,
          amount: paymentAmount,
        }
      })
      console.log(`⚡ verifyMonthlyPayment: Updated existing pending payment record ${pendingPayment.id} to SUCCESS.`)
    } else {
      // Create new payment record
      await prisma.payment.create({
        data: {
          bookingId: bill.bookingId,
          monthlyBillId: numericBillId,
          amount: paymentAmount,
          paymentMethod: paymentMethod as PaymentMethod,
          paymentStatus: PaymentStatus.SUCCESS,
          verificationStatus: VerificationStatus.VERIFIED,
          transactionId: transactionId || `ADMIN-VERIFIED-${Date.now()}`,
        },
      })
      console.log(`⚡ verifyMonthlyPayment: Created new payment record.`)
    }

    // AUTO EXTEND STAY CYCLE (Business Rule 3 & 4)
    const monthlyRenter = await prisma.monthlyRenter.findUnique({
      where: { bookingId: bill.bookingId }
    })

    if (monthlyRenter) {
      // Calculate cycle dates based on the BILL's month, not by stacking on currentCycleEnd
      // Parse the bill's month (e.g. "May 2026") to determine the correct cycle period
      const joinDate = new Date(monthlyRenter.joinDate)
      const joinDay = joinDate.getDate() // e.g., 23

      // Parse bill month string like "May 2026" or "April 2026"
      const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"]
      const billMonthParts = bill.month ? bill.month.trim().split(" ") : []
      const firstPart = billMonthParts[0] || ""
      const secondPart = billMonthParts[1] || ""
      const billMonthIdx = monthNames.findIndex(m => m.toLowerCase() === firstPart.toLowerCase())
      const billYear = parseInt(secondPart) || new Date().getFullYear()

      let nextStart: Date
      let nextEnd: Date

      if (billMonthIdx >= 0) {
        // The bill's month cycle starts on joinDay of that month
        // e.g., "May 2026" with joinDay=23 → cycle = May 23 - Jun 22
        nextStart = new Date(billYear, billMonthIdx, joinDay)
        nextEnd = new Date(nextStart)
        nextEnd.setMonth(nextEnd.getMonth() + 1)
        nextEnd.setDate(nextEnd.getDate() - 1)
      } else {
        // Fallback: use bill dueDate as cycle end
        nextEnd = new Date(bill.dueDate)
        nextStart = new Date(nextEnd)
        nextStart.setMonth(nextStart.getMonth() - 1)
        nextStart.setDate(nextStart.getDate() + 1)
      }

      nextEnd.setHours(23, 59, 59, 999)

      const isFull = newRemainingAmount <= 0

      console.log(`⚡ Stay Renewal: Renter id=${monthlyRenter.id}, bill=${bill.month}, cycle=${nextStart.toISOString()} to ${nextEnd.toISOString()}, isFull=${isFull}`)

      await prisma.monthlyRenter.update({
        where: { id: monthlyRenter.id },
        data: {
          currentCycleStart: nextStart,
          currentCycleEnd: nextEnd,
          dueDate: nextEnd,
          nextDueDate: nextEnd,
          paidAmount: newPaidAmount,
          pendingAmount: newRemainingAmount,
          overdueDays: 0,
          status: MonthlyRenterStatus.ACTIVE,
          paymentStatus: isFull ? "PAID" : "PARTIAL",
        }
      })
    }

    // Notify Renter
    await prisma.notification.create({
      data: {
        bookingId: bill.bookingId,
        title: "Payment Verified",
        message: `Your payment of ₹${paymentAmount} for ${bill.month} has been verified. Remaining: ₹${newRemainingAmount}`,
        type: NotificationType.PAYMENT,
        priority: NotificationPriority.MEDIUM,
      },
    })

    res.status(200).json({ 
      message: "Payment verified successfully",
      remainingAmount: newRemainingAmount,
      status: newStatus
    })
  } catch (error) {
    console.error("Verify payment error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

export const getRenterDashboardData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.userId)

    // Sync all renter overdue states first
    await throttledSyncOverdueStatuses()

    // Get active booking
    const activeBooking = await prisma.booking.findFirst({
      where: {
        userId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        bookingType: "MONTHLY",
      },
      include: {
        room: true,
        monthlyRenter: true,
      },
    })

    if (!activeBooking) {
      return res.status(200).json({
        activeBooking: null,
        monthlyBill: null,
        messages: [],
        notifications: [],
      })
    }

    // SELF-HEALING SYSTEM: Auto-resolve first month mismatch confusion dynamically
    if (activeBooking.bookingType === BookingType.MONTHLY && activeBooking.room) {
      const joinDate = new Date(activeBooking.checkInDate)
      const firstMonthName = joinDate.toLocaleString("default", { month: "long" }) + " " + joinDate.getFullYear()
      const rentAmount = activeBooking.room.monthlyPrice || (activeBooking.room.dailyPrice * 30) || (activeBooking.room.price * 30) || 0

      // 1. Ensure the first month's bill is fully marked as PAID and VERIFIED
      const firstCycleEnd = new Date(joinDate)
      firstCycleEnd.setDate(firstCycleEnd.getDate() + 29)
      firstCycleEnd.setHours(23, 59, 59, 999)

      const existingFirstBill = await prisma.monthlyBill.findFirst({
        where: { bookingId: activeBooking.id, month: firstMonthName }
      })

      if (!existingFirstBill) {
        await prisma.monthlyBill.create({
          data: {
            bookingId: activeBooking.id,
            month: firstMonthName,
            rentAmount,
            electricityAmount: 0,
            extraCharges: 0,
            totalAmount: rentAmount,
            previousDue: 0,
            totalDue: rentAmount,
            paidAmount: rentAmount,
            remainingAmount: 0,
            isPaid: true,
            status: MonthlyBillStatus.PAID_ONLINE,
            verificationStatus: VerificationStatus.VERIFIED,
            dueDate: firstCycleEnd
          }
        })
      } else if (!existingFirstBill.isPaid || existingFirstBill.remainingAmount > 0 || existingFirstBill.status !== MonthlyBillStatus.PAID_ONLINE || existingFirstBill.verificationStatus !== VerificationStatus.VERIFIED) {
        await prisma.monthlyBill.update({
          where: { id: existingFirstBill.id },
          data: {
            paidAmount: existingFirstBill.totalDue > 0 ? existingFirstBill.totalDue : rentAmount,
            remainingAmount: 0,
            isPaid: true,
            status: MonthlyBillStatus.PAID_ONLINE,
            verificationStatus: VerificationStatus.VERIFIED
          }
        })
      }

      // 3. Ensure MonthlyRenter profile is synchronized with correct staying cycle and status
      const monthlyRenter = await prisma.monthlyRenter.findUnique({
        where: { bookingId: activeBooking.id }
      })

      if (monthlyRenter) {
        const joinDate = new Date(activeBooking.checkInDate)
        const firstCycleEnd = new Date(joinDate)
        firstCycleEnd.setDate(firstCycleEnd.getDate() + 29)
        firstCycleEnd.setHours(23, 59, 59, 999)

        const secondCycleStart = new Date(firstCycleEnd)
        secondCycleStart.setDate(secondCycleStart.getDate() + 1)
        secondCycleStart.setHours(0, 0, 0, 0)

        const checkoutDate = new Date(activeBooking.checkOutDate)

        // If current date is within the second month, promote the active renter cycle to second cycle
        const now = new Date()
        const isSecondCycleActive = now >= secondCycleStart && now <= checkoutDate
        
        const targetCycleStart = isSecondCycleActive ? secondCycleStart : joinDate
        const targetCycleEnd = isSecondCycleActive ? (new Date(secondCycleStart)) : firstCycleEnd
        if (isSecondCycleActive && targetCycleEnd) {
          targetCycleEnd.setMonth(targetCycleEnd.getMonth() + 1)
          targetCycleEnd.setDate(targetCycleEnd.getDate() - 1)
          targetCycleEnd.setHours(23, 59, 59, 999)
        }

        const secondMonthName = secondCycleStart.toLocaleString("default", { month: "long" }) + " " + secondCycleStart.getFullYear()
        const latestBill = await prisma.monthlyBill.findFirst({
          where: { bookingId: activeBooking.id, month: isSecondCycleActive ? secondMonthName : firstMonthName }
        })

        const isPaid = latestBill ? (latestBill.remainingAmount <= 0) : true

        await prisma.monthlyRenter.update({
          where: { id: monthlyRenter.id },
          data: {
            stayStatus: StayStatus.CHECKED_IN,
            currentCycleStart: monthlyRenter.currentCycleStart || targetCycleStart,
            currentCycleEnd: monthlyRenter.currentCycleEnd || targetCycleEnd,
            dueDate: monthlyRenter.dueDate || targetCycleEnd,
            nextDueDate: monthlyRenter.nextDueDate || targetCycleEnd,
            status: monthlyRenter.status === "ACTIVE" || monthlyRenter.status === "PENDING_PAYMENT" ? (isPaid ? MonthlyRenterStatus.ACTIVE : MonthlyRenterStatus.PENDING_PAYMENT) : monthlyRenter.status,
            paymentStatus: isPaid ? "PAID" : "PENDING",
            pendingAmount: latestBill ? latestBill.remainingAmount : 0,
            paidAmount: latestBill ? latestBill.paidAmount : rentAmount
          }
        })
      }
    }

    // Get the most recent monthly bill for this booking
    const monthlyBill = await prisma.monthlyBill.findFirst({
      where: {
        bookingId: activeBooking.id,
      },
      include: {
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Mark messages as read for the renter
    await prisma.message.updateMany({
      where: {
        bookingId: activeBooking.id,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    // Get messages (Re-fetch to get updated isRead status)
    const messages = await prisma.message.findMany({
      where: {
        bookingId: activeBooking.id,
      },
      include: {
        sender: true,
        receiver: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    })

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: {
        bookingId: activeBooking.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    })

    console.log("✅ Dashboard data retrieved:", {
      bookingId: activeBooking.id,
      hasMonthlyBill: !!monthlyBill,
      messageCount: messages.length,
      notificationCount: notifications.length,
    })

    res.status(200).json({
      activeBooking,
      monthlyBill,
      messages,
      notifications,
    })
  } catch (error) {
    console.error("Get renter dashboard data error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const getAdminBillingStats = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query
    
    // Sync all renter overdue states first
    await throttledSyncOverdueStatuses()

    const where: any = { isDeleted: false }
    if (month && year) {
      where.month = `${month} ${year}`
    } else if (month) {
      where.month = { contains: String(month) }
    } else if (year) {
      where.month = { contains: String(year) }
    }

    const bills = await prisma.monthlyBill.findMany({
      where,
      include: {
        booking: true
      }
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    // Overdue Renters count
    const totalOverdueRenters = await prisma.monthlyRenter.count({
      where: { status: MonthlyRenterStatus.OVERDUE }
    })

    // Expiring This Week count
    const totalExpiringThisWeek = await prisma.monthlyRenter.count({
      where: {
        status: { in: [MonthlyRenterStatus.ACTIVE, MonthlyRenterStatus.PENDING_PAYMENT] },
        currentCycleEnd: {
          gte: today,
          lte: sevenDaysFromNow
        }
      }
    })

    // Occupancy Rate
    const totalRooms = await prisma.room.count({ where: { isDeleted: false } })
    const occupiedRooms = await prisma.room.count({
      where: {
        isDeleted: false,
        currentOccupancy: { gt: 0 }
      }
    })
    const occupancyPercentage = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

    const stats = {
      totalExpected: bills.reduce((sum, b) => sum + b.totalDue, 0),
      totalReceived: bills.reduce((sum, b) => sum + b.paidAmount, 0),
      remainingDues: bills.reduce((sum, b) => sum + b.remainingAmount, 0),
      totalPendingRenters: bills.filter(b => b.status === MonthlyBillStatus.PENDING).length,
      totalPartialRenters: bills.filter(b => b.status === MonthlyBillStatus.PARTIAL).length,
      totalPaidRenters: bills.filter(b => b.isPaid).length,
      totalOverdueRenters,
      totalExpiringThisWeek,
      occupancyPercentage
    }

    res.status(200).json(stats)
  } catch (error) {
    console.error("Get admin billing stats error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

export const getRoomBillingHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params
    const numericRoomId = Number(roomId)

    if (isNaN(numericRoomId)) {
      return res.status(400).json({ message: "Invalid room ID" })
    }

    const bills = await prisma.monthlyBill.findMany({
      where: {
        booking: {
          roomId: numericRoomId
        },
        isDeleted: false
      },
      include: {
        booking: true,
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.status(200).json(bills)
  } catch (error) {
    console.error("Get room billing history error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

// ==========================================
// REAL-TIME AUTO OVERDUE & STATUS SYNC SYSTEM
// ==========================================
export const syncAllRenterOverdueStatuses = async () => {
  try {
    const activeRenters = await prisma.monthlyRenter.findMany({
      where: {
        status: { in: ["ACTIVE", "DUE_SOON", "EXPIRES_TODAY", "RENEWAL_PENDING", "PENDING_ADMIN_APPROVAL", "STAY_CONTINUED", "PENDING_PAYMENT", "OVERDUE", "CONTINUE_REQUESTED", "CHECKOUT_REQUESTED"] }
      },
      include: {
        booking: true,
        renewalRequests: true
      }
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    console.log(`⚡ Monthly Renter Status Sync: checking ${activeRenters.length} renters...`)

    for (const r of activeRenters) {
      if (!r.currentCycleEnd) {
        console.log(`⚠️ Renter ${r.id}: No currentCycleEnd set, skipping`)
        continue
      }

      // Check if checkout request is approved or status is CHECKED_OUT to stop generating invoices
      const hasCheckoutApproved = await prisma.stayRenewalRequest.findFirst({
        where: {
          bookingId: r.bookingId,
          requestType: "CHECKOUT",
          status: "APPROVED"
        }
      })
      if (hasCheckoutApproved || r.status === "CHECKED_OUT") {
        continue // Renter is checked out. No next invoice generated!
      }

      const cycleEnd = new Date(r.currentCycleEnd)
      cycleEnd.setHours(0, 0, 0, 0)

      // ======================================
      // 1. AUTO DRAFT GENERATION ON CYCLE END
      // ======================================
      if (today >= cycleEnd) {
        const nextCycleStart = new Date(r.currentCycleEnd)
        nextCycleStart.setDate(nextCycleStart.getDate() + 1)
        nextCycleStart.setHours(0, 0, 0, 0)

        const nextCycleEnd = new Date(nextCycleStart)
        nextCycleEnd.setMonth(nextCycleEnd.getMonth() + 1)
        nextCycleEnd.setDate(nextCycleEnd.getDate() - 1)
        nextCycleEnd.setHours(23, 59, 59, 999)

        const nextMonthName = nextCycleStart.toLocaleString("default", { month: "long" }) + " " + nextCycleStart.getFullYear()

        // Check if next month's bill already exists (to prevent duplicates)
        const existingNextBill = await prisma.monthlyBill.findFirst({
          where: { bookingId: r.bookingId, month: nextMonthName }
        })

        if (!existingNextBill) {
          // Calculate previous dues (any unpaid sent bills)
          const unpaidSentBills = await prisma.monthlyBill.findMany({
            where: {
              bookingId: r.bookingId,
              status: { in: [MonthlyBillStatus.PENDING, MonthlyBillStatus.OVERDUE, MonthlyBillStatus.VERIFICATION_PENDING] },
              isDeleted: false
            }
          })
          const previousDue = unpaidSentBills.reduce((sum, b) => sum + b.remainingAmount, 0)

          await prisma.monthlyBill.create({
            data: {
              bookingId: r.bookingId,
              month: nextMonthName,
              rentAmount: r.rentAmount, // FLAT room rent (e.g. ₹6000)
              electricityAmount: 0,
              extraCharges: 0,
              totalAmount: r.rentAmount,
              previousDue,
              totalDue: r.rentAmount + previousDue,
              paidAmount: 0,
              remainingAmount: r.rentAmount + previousDue,
              status: MonthlyBillStatus.DRAFT, // Created as DRAFT!
              dueDate: nextCycleEnd // Default, updated on sendMonthlyInvoice
            }
          })
          console.log(`📝 Auto-created DRAFT monthly bill for booking ${r.bookingId} for month ${nextMonthName}`)
        }
      }

      // ======================================
      // 2. DYNAMIC OVERDUE & LATE PENALTY ENGINE
      // ======================================
      const unpaidBills = await prisma.monthlyBill.findMany({
        where: {
          bookingId: r.bookingId,
          status: { in: [MonthlyBillStatus.PENDING, MonthlyBillStatus.OVERDUE, MonthlyBillStatus.VERIFICATION_PENDING] },
          isDeleted: false
        }
      })

      for (const bill of unpaidBills) {
        if (!bill.dueDate) continue
        const dueDate = new Date(bill.dueDate)
        dueDate.setHours(0, 0, 0, 0)

        if (today > dueDate) {
          const diffTime = today.getTime() - dueDate.getTime()
          const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          const latePenalty = daysOverdue * 10 // ₹10 per day penalty automatically

          const newTotalDue = bill.rentAmount + bill.electricityAmount + bill.extraCharges + bill.previousDue + latePenalty
          const newRemainingAmount = Math.max(0, newTotalDue - bill.paidAmount)

          await prisma.monthlyBill.update({
            where: { id: bill.id },
            data: {
              status: MonthlyBillStatus.OVERDUE,
              daysOverdue,
              latePenalty,
              totalDue: newTotalDue,
              remainingAmount: newRemainingAmount
            }
          })
          console.log(`⚠️ Overdue Bill update for ${bill.month}: ${daysOverdue} days late, ₹${latePenalty} penalty`)
        }
      }

      // ======================================
      // 3. RENTER CYCLE / STATUS CORRELATION
      // ======================================
      const diffTime = cycleEnd.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      let newStatus = r.status
      let newOverdueDays = 0
      let newPaymentStatus = r.paymentStatus
      let newPendingAmount = 0

      // Read latest bill to calculate pending amount
      const latestBill = await prisma.monthlyBill.findFirst({
        where: { bookingId: r.bookingId, isDeleted: false, status: { not: MonthlyBillStatus.DRAFT } },
        orderBy: { createdAt: 'desc' }
      })

      const isPaid = latestBill ? latestBill.remainingAmount <= 0 : true
      newPendingAmount = latestBill ? latestBill.remainingAmount : 0

      let pendingRenewalRequest = null
      for (const req of r.renewalRequests) {
        if (req.status === "PENDING") {
          pendingRenewalRequest = req
          break
        }
      }

      if (pendingRenewalRequest) {
        if (pendingRenewalRequest.requestType === "CONTINUE_STAY") {
          newStatus = MonthlyRenterStatus.CONTINUE_REQUESTED
        } else if (pendingRenewalRequest.requestType === "CHECKOUT") {
          newStatus = MonthlyRenterStatus.CHECKOUT_REQUESTED
        }
        newPaymentStatus = "PENDING"
      } else if (latestBill && latestBill.status === MonthlyBillStatus.OVERDUE) {
        newStatus = MonthlyRenterStatus.OVERDUE
        newPaymentStatus = "OVERDUE"
        newOverdueDays = latestBill.daysOverdue
      } else if (diffDays > 0) {
        newStatus = diffDays <= 5 ? "DUE_SOON" : "ACTIVE"
        newPaymentStatus = isPaid ? "PAID" : "PENDING"
      } else if (diffDays === 0) {
        newStatus = "EXPIRES_TODAY"
        newPaymentStatus = isPaid ? "PAID" : "PENDING"
      } else {
        // Expired cycle without active bills overdue
        newStatus = MonthlyRenterStatus.PENDING_PAYMENT
        newPaymentStatus = "PENDING"
      }

      // Update Renter profile if status changed
      if (r.status !== newStatus || r.overdueDays !== newOverdueDays || r.paymentStatus !== newPaymentStatus || r.pendingAmount !== newPendingAmount) {
        await prisma.monthlyRenter.update({
          where: { id: r.id },
          data: {
            status: newStatus as any,
            overdueDays: newOverdueDays,
            paymentStatus: newPaymentStatus,
            pendingAmount: newPendingAmount
          }
        })
      }
    }
    console.log(`✅ Monthly Renter Status Sync: Complete`)
  } catch (err) {
    console.error("❌ Error in syncAllRenterOverdueStatuses:", err)
  }
}

// ==========================================
// ADMIN: SEND MONTHLY INVOICE (TRANSITION FROM DRAFT)
// ==========================================
export const sendMonthlyInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { billId } = req.params
    const { electricityAmount = 0, extraCharges = 0 } = req.body

    const numericBillId = Number(billId)
    if (isNaN(numericBillId)) {
      return res.status(400).json({ message: "Invalid bill ID" })
    }

    const bill = await prisma.monthlyBill.findUnique({
      where: { id: numericBillId },
      include: {
        booking: {
          include: { user: true }
        }
      }
    })

    if (!bill) {
      return res.status(404).json({ message: "Monthly invoice not found" })
    }

    if (bill.status !== MonthlyBillStatus.DRAFT) {
      return res.status(400).json({ message: "Only draft invoices can be sent" })
    }

    const electricity = parseFloat(String(electricityAmount || 0))
    const extras = parseFloat(String(extraCharges || 0))
    const totalAmount = bill.rentAmount + electricity + extras
    const totalDue = totalAmount + bill.previousDue
    const remainingAmount = totalDue - bill.paidAmount

    const sentAt = new Date()
    // Grace period: 5 days to pay
    const dueDate = new Date(sentAt)
    dueDate.setDate(dueDate.getDate() + 5)
    dueDate.setHours(23, 59, 59, 999)

    // Update bill to PENDING
    const updatedBill = await prisma.monthlyBill.update({
      where: { id: numericBillId },
      data: {
        electricityAmount: electricity,
        extraCharges: extras,
        totalAmount,
        totalDue,
        remainingAmount,
        status: MonthlyBillStatus.PENDING,
        sentAt,
        dueDate
      }
    })

    // Create notification for renter
    await prisma.notification.create({
      data: {
        bookingId: bill.bookingId,
        userId: bill.booking.userId,
        title: `📢 New Monthly Bill: ${bill.month}`,
        message: `Your monthly stays invoice for ${bill.month} has been sent. Total due: ₹${totalDue}. Due date: ${dueDate.toLocaleDateString()}.`,
        type: NotificationType.BILL,
        priority: NotificationPriority.HIGH
      }
    })

    console.log(`✅ Sent monthly invoice: ${bill.id} for ${bill.month}`)

    res.status(200).json({
      message: "Invoice sent to renter successfully",
      bill: updatedBill
    })
  } catch (error) {
    console.error("❌ Send monthly invoice error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

// ==========================================
// RENTER REQUEST STAY RENEWAL (Business Rule 2, 6)
// ==========================================
export const requestStayRenewal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.userId)
    const { paymentMethod = "UPI" } = req.body

    // 1. Get active booking
    const activeBooking = await prisma.booking.findFirst({
      where: {
        userId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        bookingType: "MONTHLY",
      },
      include: {
        monthlyRenter: true,
      },
    })

    if (!activeBooking || !activeBooking.monthlyRenter) {
      return res.status(404).json({ message: "No active monthly renter profile found." })
    }

    const renter = activeBooking.monthlyRenter

    // 2. Prevent Double Renewal (Business Rule 6)
    const prevEnd = renter.currentCycleEnd || renter.joinDate
    const nextStart = new Date(prevEnd)
    nextStart.setDate(nextStart.getDate() + 1)
    
    const nextEnd = new Date(nextStart)
    nextEnd.setMonth(nextEnd.getMonth() + 1)
    nextEnd.setDate(nextEnd.getDate() - 1)

    const monthName = nextStart.toLocaleString("default", { month: "long" }) + " " + nextStart.getFullYear()

    const existingPendingBill = await prisma.monthlyBill.findFirst({
      where: {
        bookingId: activeBooking.id,
        month: monthName,
        isDeleted: false
      }
    })

    if (existingPendingBill) {
      return res.status(400).json({ message: "A stay renewal request is already pending verification for the next cycle." })
    }

    // 3. Create Stay Renewal MonthlyBill (under the hood)
    const newBill = await prisma.monthlyBill.create({
      data: {
        bookingId: activeBooking.id,
        month: monthName,
        rentAmount: renter.rentAmount,
        electricityAmount: 0,
        extraCharges: 0,
        totalDue: renter.rentAmount,
        paidAmount: 0,
        remainingAmount: renter.rentAmount,
        dueDate: nextEnd,
        status: MonthlyBillStatus.VERIFICATION_PENDING,
        verificationStatus: VerificationStatus.PENDING,
      }
    })

    // 4. Create Payment Record (Verification Pending)
    await prisma.payment.create({
      data: {
        bookingId: activeBooking.id,
        monthlyBillId: newBill.id,
        amount: renter.rentAmount,
        paymentMethod: paymentMethod as PaymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        verificationStatus: VerificationStatus.PENDING,
        transactionId: `RENEWAL-${Date.now()}`,
      }
    })

    // 5. Update MonthlyRenter's payment status to trigger waiting state
    await prisma.monthlyRenter.update({
      where: { id: renter.id },
      data: {
        paymentStatus: "PENDING_VERIFICATION"
      }
    })

    // 6. Create admin notification
    await prisma.notification.create({
      data: {
        bookingId: activeBooking.id,
        title: "Renewal Payment Received",
        message: `Renter ${activeBooking.customerName} submitted stay renewal request for room ${activeBooking.roomId} (${monthName}). Please verify.`,
        type: NotificationType.BILL,
        priority: NotificationPriority.HIGH,
      }
    })

    res.status(200).json({
      message: "Stay renewal request submitted successfully. Waiting for admin verification.",
      bill: newBill
    })
  } catch (error) {
    console.error("❌ Request stay renewal error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

// ==========================================
// TRIGGER MONTHLY REMINDERS BULK (ADMIN)
// ==========================================
export const triggerMonthlyReminders = async (req: AuthRequest, res: Response) => {
  try {
    const result = await runAutomaticBillingReminders(true)
    
    return res.status(200).json({
      success: result.success,
      message: `Stay cycle reminders dispatched successfully! Notified ${result.notifiedCount} renters.`,
      notifiedCount: result.notifiedCount,
      logs: result.logs
    })
  } catch (err: any) {
    console.error("Trigger monthly reminders controller error:", err)
    return res.status(500).json({
      success: false,
      message: "Server error triggering automatic alerts.",
      error: err.message
    })
  }
}

// ==========================================
// SEND RENTER REMINDER (ADMIN)
// ==========================================
export const sendRenterReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params
    const numericBookingId = Number(bookingId)

    if (isNaN(numericBookingId)) {
      return res.status(400).json({ message: "Invalid booking ID" })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: numericBookingId },
      include: { monthlyRenter: true }
    })

    if (!booking || !booking.monthlyRenter) {
      return res.status(404).json({ message: "Renter profile not found." })
    }

    const renter = booking.monthlyRenter
    const dueAmount = renter.pendingAmount || renter.rentAmount

    // Create Notification for Renter
    await prisma.notification.create({
      data: {
        bookingId: numericBookingId,
        title: "🚨 Rent Payment Reminder",
        message: `Dear ${booking.customerName}, this is a reminder to settle your monthly rent of ₹${dueAmount.toLocaleString()}. Please renew your stay promptly.`,
        type: NotificationType.BILL,
        priority: NotificationPriority.HIGH,
      }
    })

    console.log(`✉️ Reminder notification sent to renter ${booking.customerName} (booking ${bookingId})`)

    res.status(200).json({ message: `Payment reminder notification sent successfully to ${booking.customerName}!` })
  } catch (error) {
    console.error("❌ Send renter reminder error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

// ==========================================
// REQUEST RENTER CHECKOUT (RENTER)
// ==========================================
export const requestRenterCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.userId)
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." })
    }

    // Find active booking and monthly renter record
    const booking = await prisma.booking.findFirst({
      where: {
        userId,
        bookingType: "MONTHLY",
        status: BookingStatus.CONFIRMED,
        stayStatus: { in: [StayStatus.CHECKED_IN, StayStatus.BOOKED, StayStatus.STAYING] }
      },
      include: {
        monthlyRenter: true
      }
    })

    if (!booking || !booking.monthlyRenter) {
      return res.status(404).json({ message: "Active monthly stay profile not found." })
    }

    const renter = booking.monthlyRenter

    if (renter.status === MonthlyRenterStatus.CHECKOUT_REQUESTED) {
      return res.status(400).json({ message: "Checkout request is already pending verification." })
    }

    // Update monthly renter status
    await prisma.monthlyRenter.update({
      where: { id: renter.id },
      data: {
        status: MonthlyRenterStatus.CHECKOUT_REQUESTED
      }
    })

    // Create notification for admin
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        title: "🔔 Checkout Request Submitted",
        message: `Renter ${booking.customerName} (Room ${booking.roomId}) has submitted a stay checkout request. Please approve or reject.`,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.HIGH,
      }
    })

    console.log(`🛎️ Checkout request received from renter ${booking.customerName} (booking ${booking.id})`)

    res.status(200).json({
      message: "Checkout request submitted successfully. Staying access will terminate upon Admin approval.",
      status: "CHECKOUT_PENDING"
    })
  } catch (error) {
    console.error("❌ Request renter checkout error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

// ==========================================
// REJECT RENTER CHECKOUT (ADMIN)
// ==========================================
export const rejectRenterCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params
    const numericBookingId = Number(bookingId)

    if (isNaN(numericBookingId)) {
      return res.status(400).json({ message: "Invalid booking ID" })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: numericBookingId },
      include: { monthlyRenter: true }
    })

    if (!booking || !booking.monthlyRenter) {
      return res.status(404).json({ message: "Monthly renter stay profile not found." })
    }

    const renter = booking.monthlyRenter

    // Revert status back to ACTIVE or OVERDUE depending on date
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = renter.dueDate ? new Date(renter.dueDate) : today
    due.setHours(0, 0, 0, 0)

    const isOverdue = today.getTime() > due.getTime()
    const revertedStatus = isOverdue ? MonthlyRenterStatus.OVERDUE : MonthlyRenterStatus.ACTIVE

    await prisma.monthlyRenter.update({
      where: { id: renter.id },
      data: {
        status: revertedStatus
      }
    })

    // Create notification for renter
    await prisma.notification.create({
      data: {
        bookingId: numericBookingId,
        title: "❌ Checkout Request Rejected",
        message: `Your stay checkout request has been rejected by the property manager. Please contact administration for details.`,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.HIGH,
      }
    })

    console.log(`❌ Admin rejected checkout request for renter ${booking.customerName} (reverted to ${revertedStatus})`)

    res.status(200).json({
      message: `Checkout request for ${booking.customerName} successfully rejected. Renter status set to ${revertedStatus}.`,
      status: revertedStatus
    })
  } catch (error) {
    console.error("❌ Reject renter checkout error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

// ==========================================
// NEW PROFESSIONAL RENEWAL LIFECYCLE SYSTEM
// ==========================================

/**
 * RENTER: Request to Continue Stay
 * When monthly cycle expires, renter can request to continue
 * Creates StayRenewalRequest with CONTINUE_STAY type
 */
export const requestContinueStay = async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.userId)
    
    const booking = await prisma.booking.findFirst({
      where: {
        userId,
        bookingType: "MONTHLY",
        status: BookingStatus.CONFIRMED,
      },
      include: { monthlyRenter: true }
    })

    if (!booking || !booking.monthlyRenter) {
      return res.status(404).json({ message: "No active monthly renter profile found" })
    }

    const renter = booking.monthlyRenter

    // Check if cycle has expired
    if (!renter.currentCycleEnd) {
      return res.status(400).json({ message: "Invalid renter profile - no cycle end date" })
    }

    const cycleEnd = new Date(renter.currentCycleEnd)
    cycleEnd.setHours(23, 59, 59, 999)
    const now = new Date()

    // Check for existing pending renewal request
    const existingRequest = await prisma.stayRenewalRequest.findFirst({
      where: {
        bookingId: booking.id,
        status: RenewalRequestStatus.PENDING
      }
    })

    if (existingRequest) {
      return res.status(400).json({ message: "You already have a pending renewal request awaiting admin approval" })
    }

    // Calculate next cycle
    const nextCycleStart = new Date(cycleEnd)
    nextCycleStart.setDate(nextCycleStart.getDate() + 1)
    nextCycleStart.setHours(0, 0, 0, 0)

    const nextCycleEnd = new Date(nextCycleStart)
    nextCycleEnd.setMonth(nextCycleEnd.getMonth() + 1)
    nextCycleEnd.setDate(nextCycleEnd.getDate() - 1)

    // Create renewal request
    const renewalRequest = await prisma.stayRenewalRequest.create({
      data: {
        bookingId: booking.id,
        monthlyRenterId: renter.id,
        requestType: RenewalRequestType.CONTINUE_STAY,
        status: RenewalRequestStatus.PENDING,
        nextCycleStart,
        nextCycleEnd,
        requestDate: new Date()
      },
      include: {
        booking: true,
        monthlyRenter: true
      }
    })

    // Update renter status
    await prisma.monthlyRenter.update({
      where: { id: renter.id },
      data: {
        status: MonthlyRenterStatus.CONTINUE_REQUESTED,
        renewalRequestDate: new Date()
      }
    })

    // Notify admin
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        title: "📋 Stay Renewal Request",
        message: `${booking.customerName} (Room ${booking.roomId}) has requested to continue stay for ${nextCycleStart.toLocaleDateString()} to ${nextCycleEnd.toLocaleDateString()}. Please review and approve.`,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.HIGH
      }
    })

    res.status(201).json({
      message: "Renewal request submitted successfully. Waiting for admin approval.",
      request: renewalRequest,
      nextCycleStart,
      nextCycleEnd
    })
  } catch (error) {
    console.error("❌ Request continue stay error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

/**
 * RENTER: Request Checkout
 */
export const requestCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.userId)
    
    const booking = await prisma.booking.findFirst({
      where: {
        userId,
        bookingType: "MONTHLY",
        status: BookingStatus.CONFIRMED,
      },
      include: { monthlyRenter: true }
    })

    if (!booking || !booking.monthlyRenter) {
      return res.status(404).json({ message: "No active monthly renter profile found" })
    }

    const renter = booking.monthlyRenter

    // Check if cycle has expired
    if (!renter.currentCycleEnd) {
      return res.status(400).json({ message: "Invalid renter profile" })
    }

    const cycleEnd = new Date(renter.currentCycleEnd)
    cycleEnd.setHours(23, 59, 59, 999)
    const now = new Date()

    // Check for existing pending checkout request
    const existingRequest = await prisma.stayRenewalRequest.findFirst({
      where: {
        bookingId: booking.id,
        requestType: RenewalRequestType.CHECKOUT,
        status: RenewalRequestStatus.PENDING
      }
    })

    if (existingRequest) {
      return res.status(400).json({ message: "You already have a checkout request pending admin approval" })
    }

    // Create checkout request
    const checkoutRequest = await prisma.stayRenewalRequest.create({
      data: {
        bookingId: booking.id,
        monthlyRenterId: renter.id,
        requestType: RenewalRequestType.CHECKOUT,
        status: RenewalRequestStatus.PENDING,
        requestDate: new Date()
      }
    })

    // Update renter status
    await prisma.monthlyRenter.update({
      where: { id: renter.id },
      data: {
        status: MonthlyRenterStatus.CHECKOUT_REQUESTED,
        checkoutRequestDate: new Date()
      }
    })

    // Notify admin
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        title: "🚪 Checkout Request",
        message: `${booking.customerName} (Room ${booking.roomId}) has requested checkout. Please verify final billing and approve termination.`,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.HIGH
      }
    })

    res.status(201).json({
      message: "Checkout request submitted. Awaiting admin approval.",
      request: checkoutRequest
    })
  } catch (error) {
    console.error("❌ Request checkout error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

/**
 * ADMIN: Get Pending Renewal/Checkout Requests
 */
export const getPendingRenewalRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { requestType, status } = req.query

    const where: any = {}
    
    if (requestType) {
      where.requestType = requestType as RenewalRequestType
    }
    
    if (status) {
      where.status = status as RenewalRequestStatus
    } else {
      where.status = RenewalRequestStatus.PENDING // Default to pending
    }

    const requests = await prisma.stayRenewalRequest.findMany({
      where,
      include: {
        booking: {
          include: {
            room: true,
            user: true,
            monthlyRenter: true,
            monthlyBills: {
              orderBy: { createdAt: 'desc' },
              take: 3
            }
          }
        },
        monthlyRenter: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        requestDate: 'desc'
      }
    })

    res.status(200).json(requests)
  } catch (error) {
    console.error("❌ Get pending renewal requests error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

/**
 * ADMIN: Approve Continue Stay Request
 * Generates next month bill with rent + electricity + pending dues + penalties
 */
export const approveContinueStay = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params
    const { electricityAmount = 0, otherCharges = 0, notes = "" } = req.body

    const numericRequestId = Number(requestId)
    if (isNaN(numericRequestId)) {
      return res.status(400).json({ message: "Invalid request ID" })
    }

    const renewalRequest = await prisma.stayRenewalRequest.findUnique({
      where: { id: numericRequestId },
      include: {
        booking: {
          include: {
            monthlyRenter: true,
            monthlyBills: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        },
        monthlyRenter: true
      }
    })

    if (!renewalRequest) {
      return res.status(404).json({ message: "Renewal request not found" })
    }

    if (renewalRequest.requestType !== RenewalRequestType.CONTINUE_STAY) {
      return res.status(400).json({ message: "This is not a continue stay request" })
    }

    if (renewalRequest.status !== RenewalRequestStatus.PENDING) {
      return res.status(400).json({ message: "This request has already been processed" })
    }

    const booking = renewalRequest.booking
    const renter = renewalRequest.monthlyRenter

    // Calculate penalty if applicable
    let penalty = 0
    const cycleEnd = new Date(renter.currentCycleEnd!)
    cycleEnd.setHours(23, 59, 59, 999)
    const now = new Date()
    const daysExpired = Math.ceil((now.getTime() - cycleEnd.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysExpired > 10) {
      const penaltyDays = daysExpired - 10
      penalty = penaltyDays * 10
    }

    // Get previous pending amount
    const lastBill = booking.monthlyBills[0]
    const previousPending = lastBill ? lastBill.remainingAmount : 0

    // Format cycle dates for month name
    const nextCycleStart = renewalRequest.nextCycleStart!
    const monthName = nextCycleStart.toLocaleString("default", { month: "long" }) + " " + nextCycleStart.getFullYear()

    // Create new bill with all charges
    const billTotal = renter.rentAmount + parseFloat(String(electricityAmount || 0)) + previousPending + penalty + parseFloat(String(otherCharges || 0))
    
    let newBill
    const existingBill = await prisma.monthlyBill.findFirst({
      where: { bookingId: booking.id, month: monthName }
    })

    if (existingBill) {
      newBill = await prisma.monthlyBill.update({
        where: { id: existingBill.id },
        data: {
          rentAmount: renter.rentAmount,
          electricityAmount: parseFloat(String(electricityAmount || 0)),
          extraCharges: previousPending + penalty + parseFloat(String(otherCharges || 0)),
          totalAmount: billTotal,
          totalDue: billTotal,
          previousDue: previousPending,
          remainingAmount: billTotal - existingBill.paidAmount,
          status: MonthlyBillStatus.PENDING,
          verificationStatus: VerificationStatus.PENDING
        }
      })
    } else {
      newBill = await prisma.monthlyBill.create({
        data: {
          bookingId: booking.id,
          month: monthName,
          rentAmount: renter.rentAmount,
          electricityAmount: parseFloat(String(electricityAmount || 0)),
          extraCharges: previousPending + penalty + parseFloat(String(otherCharges || 0)), // Bundle pending dues + penalty + other charges as extra charges
          totalAmount: billTotal,
          totalDue: billTotal,
          previousDue: previousPending,
          paidAmount: 0,
          remainingAmount: billTotal,
          dueDate: renewalRequest.nextCycleEnd!,
          status: MonthlyBillStatus.PENDING,
          verificationStatus: VerificationStatus.PENDING
        }
      })
    }

    // Update renewal request
    await prisma.stayRenewalRequest.update({
      where: { id: numericRequestId },
      data: {
        status: RenewalRequestStatus.APPROVED,
        decisionDate: new Date(),
        generatedBillId: newBill.id,
        approvalNotes: notes
      }
    })

    // Update monthly renter
    await prisma.monthlyRenter.update({
      where: { id: renter.id },
      data: {
        status: MonthlyRenterStatus.PENDING_PAYMENT,
        currentCycleStart: renewalRequest.nextCycleStart,
        currentCycleEnd: renewalRequest.nextCycleEnd,
        dueDate: renewalRequest.nextCycleEnd,
        lastElectricityAmount: parseFloat(String(electricityAmount || 0)),
        latePenalty: penalty,
        renewalDecisionDate: new Date(),
        ...(renewalRequest.nextCycleEnd ? { nextDueDate: renewalRequest.nextCycleEnd } : {})
      }
    })

    // Store electricity for future reference
    await prisma.monthlyRenter.update({
      where: { id: renter.id },
      data: {
        lastElectricityAmount: parseFloat(String(electricityAmount || 0))
      }
    })

    // Notify renter with bill details
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        title: "✅ Stay Renewal Approved",
        message: `Your stay renewal has been approved! New bill generated for ${monthName}. Rent: ₹${renter.rentAmount}, Electricity: ₹${electricityAmount}, Other Charges: ₹${otherCharges}, Total: ₹${billTotal}. Please pay to confirm your stay.`,
        type: NotificationType.BILL,
        priority: NotificationPriority.HIGH
      }
    })

    res.status(200).json({
      message: "Renewal approved successfully. Bill generated and sent to renter.",
      bill: newBill,
      monthName,
      totalDue: billTotal
    })
  } catch (error) {
    console.error("❌ Approve continue stay error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

/**
 * ADMIN: Reject Continue Stay Request
 */
export const rejectContinueStay = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params
    const { reason = "" } = req.body

    const numericRequestId = Number(requestId)
    if (isNaN(numericRequestId)) {
      return res.status(400).json({ message: "Invalid request ID" })
    }

    const renewalRequest = await prisma.stayRenewalRequest.findUnique({
      where: { id: numericRequestId },
      include: {
        booking: true,
        monthlyRenter: true
      }
    })

    if (!renewalRequest) {
      return res.status(404).json({ message: "Renewal request not found" })
    }

    if (renewalRequest.status !== RenewalRequestStatus.PENDING) {
      return res.status(400).json({ message: "This request has already been processed" })
    }

    // Update request
    await prisma.stayRenewalRequest.update({
      where: { id: numericRequestId },
      data: {
        status: RenewalRequestStatus.REJECTED,
        rejectionReason: reason,
        decisionDate: new Date()
      }
    })

    // Revert renter status to CHECKOUT_REQUESTED (they must checkout)
    await prisma.monthlyRenter.update({
      where: { id: renewalRequest.monthlyRenterId },
      data: {
        status: MonthlyRenterStatus.CHECKOUT_REQUESTED
      }
    })

    // Notify renter
    await prisma.notification.create({
      data: {
        bookingId: renewalRequest.bookingId,
        title: "❌ Renewal Request Rejected",
        message: `Your stay renewal request has been rejected. Reason: ${reason || "Not specified"}. Please proceed with checkout.`,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.HIGH
      }
    })

    res.status(200).json({
      message: "Renewal request rejected. Renter notified for checkout."
    })
  } catch (error) {
    console.error("❌ Reject continue stay error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

/**
 * ADMIN: Approve Checkout Request
 * Completes booking and releases room
 */
export const approveCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params
    const { notes = "" } = req.body

    const numericRequestId = Number(requestId)
    if (isNaN(numericRequestId)) {
      return res.status(400).json({ message: "Invalid request ID" })
    }

    const checkoutRequest = await prisma.stayRenewalRequest.findUnique({
      where: { id: numericRequestId },
      include: {
        booking: {
          include: {
            room: true,
            monthlyBills: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        },
        monthlyRenter: true
      }
    })

    if (!checkoutRequest) {
      return res.status(404).json({ message: "Checkout request not found" })
    }

    if (checkoutRequest.requestType !== RenewalRequestType.CHECKOUT) {
      return res.status(400).json({ message: "This is not a checkout request" })
    }

    const booking = checkoutRequest.booking

    // Complete the booking
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.COMPLETED,
        stayStatus: StayStatus.CHECKED_OUT,
        updatedAt: new Date()
      }
    })

    // Release the room
    await prisma.room.update({
      where: { id: booking.roomId },
      data: {
        isAvailable: true,
        currentOccupancy: Math.max(0, booking.room.currentOccupancy - 1)
      }
    })

    // Update renter status
    await prisma.monthlyRenter.update({
      where: { id: checkoutRequest.monthlyRenterId },
      data: {
        status: MonthlyRenterStatus.CHECKED_OUT,
        stayStatus: StayStatus.CHECKED_OUT
      }
    })

    // Update checkout request
    await prisma.stayRenewalRequest.update({
      where: { id: numericRequestId },
      data: {
        status: RenewalRequestStatus.APPROVED,
        decisionDate: new Date(),
        approvalNotes: notes
      }
    })

    // Notify renter
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        title: "✅ Checkout Approved",
        message: `Your checkout has been approved. Thank you for staying with us. Room ${booking.room.roomNumber} is now released.`,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.MEDIUM
      }
    })

    res.status(200).json({
      message: "Checkout approved. Booking completed and room released.",
      booking: {
        id: booking.id,
        bookingId: booking.bookingId,
        status: BookingStatus.COMPLETED,
        room: booking.room.roomNumber
      }
    })
  } catch (error) {
    console.error("❌ Approve checkout error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}

/**
 * ADMIN: Reject Checkout Request
 * (Renter must continue stay)
 */
export const rejectCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params
    const { reason = "" } = req.body

    const numericRequestId = Number(requestId)
    if (isNaN(numericRequestId)) {
      return res.status(400).json({ message: "Invalid request ID" })
    }

    const checkoutRequest = await prisma.stayRenewalRequest.findUnique({
      where: { id: numericRequestId },
      include: {
        booking: true,
        monthlyRenter: true
      }
    })

    if (!checkoutRequest) {
      return res.status(404).json({ message: "Checkout request not found" })
    }

    // Update request
    await prisma.stayRenewalRequest.update({
      where: { id: numericRequestId },
      data: {
        status: RenewalRequestStatus.REJECTED,
        rejectionReason: reason,
        decisionDate: new Date()
      }
    })

    // Revert to RENEWAL_PENDING (must decide again)
    await prisma.monthlyRenter.update({
      where: { id: checkoutRequest.monthlyRenterId },
      data: {
        status: MonthlyRenterStatus.RENEWAL_PENDING
      }
    })

    // Notify renter
    await prisma.notification.create({
      data: {
        bookingId: checkoutRequest.bookingId,
        title: "❌ Checkout Rejected",
        message: `Your checkout request has been rejected. Reason: ${reason || "Not specified"}. Please submit a new renewal or checkout request.`,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.HIGH
      }
    })

    res.status(200).json({
      message: "Checkout request rejected. Renter notified."
    })
  } catch (error) {
    console.error("❌ Reject checkout error:", error)
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" })
  }
}
