import type { Response } from "express"
import prisma from "../config/prisma.js"
import type { AuthRequest } from "../middleware/authMiddleware.js"
import { BookingStatus, PaymentStatus, StayStatus, BookingType, NotificationType, NotificationPriority, VerificationStatus } from "@prisma/client"

// ==========================================
// CREATE BOOKING
// ==========================================
export const createBooking = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    console.log("🔍 DEBUG: Booking Creation Started")
    console.log("   - User ID:", req.userId)
    console.log("   - Request Body:", JSON.stringify(req.body, null, 2))

    const {
      roomId,
      customerName,
      customerEmail,
      customerPhone,
      customerAadhaar,
      checkInDate,
      checkOutDate,
      numberOfGuests,
    } = req.body

    // 1. Check required fields
    const requiredFields = { roomId, customerName, customerEmail, customerPhone, checkInDate, checkOutDate, numberOfGuests }
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => value === undefined || value === null || value === "")
      .map(([key]) => key)

    if (missingFields.length > 0) {
      console.log("❌ Validation failed: Missing fields:", missingFields)
      return res.status(400).json({
        message: "Validation failed: Missing required fields",
        missingFields,
        received: req.body
      })
    }

    // 2. Check room
    const room = await prisma.room.findUnique({
      where: { id: Number(roomId) },
    })

    if (!room) {
      console.log(`❌ Validation failed: Room ${roomId} not found`)
      return res.status(404).json({ message: "Room not found" })
    }

    if (!room.isAvailable) {
      console.log(`❌ Validation failed: Room ${roomId} is not available`)
      return res.status(400).json({ message: "Room is not available" })
    }

    if (room.currentOccupancy >= room.capacity) {
      console.log(`❌ Validation failed: Room ${roomId} is full (${room.currentOccupancy}/${room.capacity})`)
      return res.status(400).json({ message: "Room is already at full capacity" })
    }

    // 3. Check existing booking
    const existingActiveBooking = await prisma.booking.findFirst({
      where: {
        userId: req.userId!,
        roomId: Number(roomId),
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        isDeleted: false,
      }
    })

    if (existingActiveBooking) {
      console.log(`❌ Validation failed: User ${req.userId} already has active booking ${existingActiveBooking.bookingId}`)
      return res.status(400).json({
        message: "You already have an active booking for this room",
        existingBookingId: existingActiveBooking.bookingId
      })
    }

    // 4. Calculate dates
    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)
    
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      console.log("❌ Validation failed: Invalid date format")
      return res.status(400).json({ message: "Invalid date format" })
    }

    const totalDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

    if (totalDays <= 0) {
      console.log(`❌ Validation failed: Invalid date range (${totalDays} days)`)
      return res.status(400).json({ message: "Check-out date must be after check-in date" })
    }

    const totalAmount = room.price * totalDays
    console.log(`   - Calculation: ${totalDays} days @ ₹${room.price} = ₹${totalAmount}`)

    // 5. Create booking
    const bookingCount = await prisma.booking.count()
    const bookingId = `RBS-${new Date().getFullYear()}-${String(bookingCount + 1).padStart(4, '0')}`

    const booking = await prisma.booking.create({
      data: {
        bookingId,
        userId: req.userId!,
        customerName,
        customerEmail,
        customerPhone,
        customerAadhaar: customerAadhaar || null,
        roomId: Number(roomId),
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: Number(numberOfGuests),
        totalDays,
        totalAmount,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        stayStatus: StayStatus.BOOKED,
      },
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        title: "New Booking",
        message: `New booking ${bookingId} for room ${room.roomNumber}`,
        type: NotificationType.BOOKING,
        priority: NotificationPriority.MEDIUM,
      },
    })

    console.log(`✅ SUCCESS: Booking created: ${bookingId}`)

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    })
  } catch (error: any) {
    console.error("❌ ERROR: Create booking failed:", error)
    res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    })
  }
}

// ==========================================
// PROCESS PAYMENT
// ==========================================
export const processPayment = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { bookingId, paymentMethod } = req.body

    if (!bookingId || !paymentMethod) {
      return res.status(400).json({
        message: "Booking ID and payment method are required",
      })
    }

    // Find booking
    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      include: { room: true },
    })

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      })
    }

    // DEMO MODE CHECK
    const isDemoMode = process.env.DEMO_PAYMENT_MODE === "true" || true // Default to true for now as requested
    
    // Generate transaction ID
    const transactionId = `DEMO-TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalAmount,
        paymentMethod,
        transactionId,
        paymentStatus: PaymentStatus.SUCCESS, // Simulated success
      },
    })

    // Update booking status
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.SUCCESS,
      },
    })

    // Update room occupancy
    await prisma.room.update({
      where: { id: booking.roomId },
      data: { 
        currentOccupancy: { increment: 1 },
        isAvailable: booking.room.currentOccupancy + 1 >= booking.room.capacity ? false : true
      },
    })

    // Create payment notification
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        title: "Payment Received",
        message: `Payment of ₹${booking.totalAmount} received for booking ${booking.bookingId}`,
        type: NotificationType.PAYMENT,
        priority: NotificationPriority.HIGH,
      },
    })

    console.log(`✅ Payment processed: ${transactionId}`)

    res.status(200).json({
      message: "Payment successful",
      payment,
      booking: {
        ...booking,
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.SUCCESS,
      },
    })
  } catch (error) {
    console.error("Process payment error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET USER BOOKINGS
// ==========================================
export const getUserBookings = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.userId! },
      include: {
        room: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    })

    res.status(200).json(bookings)
  } catch (error) {
    console.error("Get user bookings error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET ALL BOOKINGS (ADMIN)
// ==========================================
export const getAllBookings = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    })

    res.status(200).json(bookings)
  } catch (error) {
    console.error("Get all bookings error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET MONTHLY ACTIVE BOOKINGS (ADMIN)
// ==========================================
export const getMonthlyActiveBookings = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // Debug: Fetch ALL bookings first to see what's in the DB
    const allBookings = await prisma.booking.findMany({
      include: { room: true }
    });
    console.log(`🔍 DEBUG: Total bookings in DB: ${allBookings.length}`);
    allBookings.forEach(b => {
      console.log(`   - Booking ${b.bookingId}: Status=${b.status}, Type=${b.room?.bookingType}`);
    });

    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] }, // Include pending for demo/testing
        room: {
          bookingType: {
            in: [BookingType.MONTHLY]
          }
        },
        isDeleted: false
      },
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    console.log(`✅ Filtered Result: Found ${bookings.length} potential monthly renters`)
    res.status(200).json(bookings)
  } catch (error) {
    console.error("Get monthly active bookings error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// ==========================================
// GET SINGLE BOOKING
// ==========================================
export const getBookingById = async (
  req: AuthRequest,
  res: Response
) => {
  const { id } = req.params
  console.log("🔍 DEBUG: getBookingById Request")
  console.log("   - Params ID:", id)
  console.log("   - User ID from Token:", req.userId)

  try {
    const bookingId = Number(id)
    if (!id || isNaN(bookingId)) {
      console.log("❌ Invalid booking ID received:", id)
      return res.status(400).json({ message: "Invalid booking ID" })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payments: true, // FIXED: Relation name is 'payments' in schema.prisma
      },
    })

    if (!booking) {
      console.log(`❌ Booking not found for ID: ${bookingId}`)
      return res.status(404).json({
        message: "Booking not found",
      })
    }

    console.log("✅ Booking found successfully")
    res.status(200).json(booking)
  } catch (error: any) {
    console.error("❌ ERROR in getBookingById:", error)
    res.status(500).json({
      message: error.message || "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    })
  }
}

// ==========================================
// CANCEL BOOKING (ADMIN)
// ==========================================
export const cancelBooking = async (
  req: AuthRequest,
  res: Response
) => {
  console.log("🔍 cancelBooking Params:", req.params)
  const { id } = req.params

  try {
    const bookingId = Number(id)
    if (!id || isNaN(bookingId)) {
      return res.status(400).json({ message: "Invalid booking ID" })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    })

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      })
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    })

    // Update room occupancy if it was confirmed
    if (booking.status === BookingStatus.CONFIRMED as any) {
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { 
          currentOccupancy: { decrement: 1 },
          isAvailable: true 
        },
      })
    }

    // Create cancellation notification
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        title: "Booking Cancelled",
        message: `Booking ${booking.bookingId} has been cancelled`,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.MEDIUM,
      },
    })

    console.log(`✅ Booking cancelled: ${booking.bookingId}`)

    res.status(200).json({
      message: "Booking cancelled successfully",
    })
  } catch (error) {
    console.error("Cancel booking error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
// ==========================================
// ADMIN: CONFIRM BOOKING MANUALLY
// ==========================================
export const confirmBooking = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params

    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) },
      include: { room: true }
    })

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    if (booking.status === BookingStatus.CONFIRMED) {
      return res.status(400).json({ message: "Booking is already confirmed" })
    }

    // 1. Create a payment record for the manual confirmation
    const transactionId = `MANUAL-CONFIRM-${Date.now()}`
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalAmount,
        paymentMethod: "CASH", // Default to CASH for manual admin confirmation
        transactionId,
        paymentStatus: PaymentStatus.SUCCESS,
        verificationStatus: VerificationStatus.VERIFIED
      }
    })

    // 2. Update booking status
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.SUCCESS,
      }
    })

    // 3. Update room occupancy
    await prisma.room.update({
      where: { id: booking.roomId },
      data: { 
        currentOccupancy: { increment: 1 },
        isAvailable: booking.room.currentOccupancy + 1 >= booking.room.capacity ? false : true
      }
    })

    // 4. Create notification
    await prisma.notification.create({
      data: {
        bookingId: booking.id,
        title: "Booking Confirmed",
        message: `Your booking ${booking.bookingId} has been manually confirmed by admin.`,
        type: NotificationType.BOOKING,
        priority: NotificationPriority.HIGH
      }
    })

    console.log(`✅ Admin manually confirmed booking: ${booking.bookingId}`)

    res.status(200).json({
      message: "Booking confirmed successfully",
    })
  } catch (error: any) {
    console.error("Confirm booking error:", error)
    res.status(500).json({
      message: "Server error",
      error: error.message
    })
  }
}
