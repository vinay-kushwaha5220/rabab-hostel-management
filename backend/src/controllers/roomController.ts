import type {
  Request,
  Response,
} from "express"

import prisma from "../config/prisma.js"
import type { AuthRequest } from "../middleware/authMiddleware.js"
import { RoomType, BookingType } from "@prisma/client"



// ==========================================
// CREATE ROOM (ADMIN)
// ==========================================
export const createRoom = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      roomNumber,
      title,
      description,
      price,
      roomType,
      bookingType,
      floor,
      capacity,
      images,
      amenities,
    } = req.body

    const existingRoom =
      await prisma.room.findUnique({
        where: {
          roomNumber,
        },
      })

    if (existingRoom) {
      return res.status(400).json({
        message: "Room already exists",
      })
    }

    const room = await prisma.room.create({
      data: {
        roomNumber,
        title,
        description,
        price: Number(price),
        roomType: roomType as RoomType,
        bookingType: bookingType as BookingType,
        floor: Number(floor),
        capacity: Number(capacity),
        isAvailable: true,
        images: images ? JSON.stringify(images) : null,
        amenities: amenities ? JSON.stringify(amenities) : null,
      },
    })

    res.status(201).json({
      message: "Room created successfully",
      room,
    })
  } catch (error) {
    console.error("Create room error:", error)

    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}

// ==========================================
// GET ALL ROOMS (WITH FILTERS)
// ==========================================
export const getRooms = async (
  req: Request,
  res: Response
) => {
  try {
    const { roomType, bookingType, minPrice, maxPrice, available } = req.query

    // Build filter object
    const where: any = {}

    if (roomType) {
      where.roomType = roomType
    }

    if (bookingType) {
      where.bookingType = bookingType
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = Number(minPrice)
      if (maxPrice) where.price.lte = Number(maxPrice)
    }

    if (available === 'true') {
      where.isAvailable = true
    }

    const rooms = await prisma.room.findMany({
      where,
      include: {
        monthlyRenters: {
          where: {
            status: "ACTIVE",
          },
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        bookings: {
          where: {
            status: "CONFIRMED",
          },
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Parse JSON fields
    const roomsWithParsedData = rooms.map(room => {
      let currentRenterName: string | undefined = undefined;

      const activeMonthlyRenter = room.monthlyRenters?.find(r => r.status === "ACTIVE");
      if (activeMonthlyRenter) {
        currentRenterName = activeMonthlyRenter.user?.name;
      }

      if (!currentRenterName) {
        const activeBooking = room.bookings?.find(b => b.status === "CONFIRMED");
        if (activeBooking) {
          currentRenterName = activeBooking.customerName || activeBooking.user?.name;
        }
      }

      return {
        ...room,
        currentRenterName,
        images: room.images ? JSON.parse(room.images) : [],
        amenities: room.amenities ? JSON.parse(room.amenities) : [],
        monthlyRenters: undefined,
        bookings: undefined,
      }
    })

    console.log(`✅ Fetched ${rooms.length} rooms from database`)
    res.status(200).json(roomsWithParsedData)
  } catch (error) {
    console.error("Get rooms error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}

// ==========================================
// GET SINGLE ROOM
// ==========================================
export const getSingleRoom = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params

    const room = await prisma.room.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        monthlyRenters: {
          where: {
            status: "ACTIVE",
          },
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        bookings: {
          where: {
            status: "CONFIRMED",
          },
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      })
    }

    let currentRenterName: string | undefined = undefined;

    const activeMonthlyRenter = room.monthlyRenters?.find(r => r.status === "ACTIVE");
    if (activeMonthlyRenter) {
      currentRenterName = activeMonthlyRenter.user?.name;
    }

    if (!currentRenterName) {
      const activeBooking = room.bookings?.find(b => b.status === "CONFIRMED");
      if (activeBooking) {
        currentRenterName = activeBooking.customerName || activeBooking.user?.name;
      }
    }

    // Parse JSON fields
    const roomWithParsedData = {
      ...room,
      currentRenterName,
      images: room.images ? JSON.parse(room.images) : [],
      amenities: room.amenities ? JSON.parse(room.amenities) : [],
      monthlyRenters: undefined,
      bookings: undefined,
    }

    res.status(200).json(roomWithParsedData)
  } catch (error) {
    console.error("Get single room error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}

// ==========================================
// UPDATE ROOM (ADMIN)
// ==========================================
export const updateRoom = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params
    const {
      roomNumber,
      title,
      description,
      price,
      roomType,
      bookingType,
      floor,
      capacity,
      isAvailable,
      images,
      amenities,
    } = req.body

    const room = await prisma.room.findUnique({
      where: { id: Number(id) },
    })

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      })
    }

    const updatedRoom = await prisma.room.update({
      where: { id: Number(id) },
      data: {
        roomNumber: roomNumber || room.roomNumber,
        title: title || room.title,
        description: description || room.description,
        price: price ? Number(price) : room.price,
        roomType: (roomType as RoomType) || room.roomType,
        bookingType: (bookingType as BookingType) || room.bookingType,
        floor: floor ? Number(floor) : room.floor,
        capacity: capacity ? Number(capacity) : room.capacity,
        isAvailable: isAvailable !== undefined ? isAvailable : room.isAvailable,
        images: images ? JSON.stringify(images) : room.images,
        amenities: amenities ? JSON.stringify(amenities) : room.amenities,
      },
    })

    res.status(200).json({
      message: "Room updated successfully",
      room: updatedRoom,
    })
  } catch (error) {
    console.error("Update room error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}

// ==========================================
// DELETE ROOM (ADMIN)
// ==========================================
export const deleteRoom = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params

    const room = await prisma.room.findUnique({
      where: { id: Number(id) },
    })

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      })
    }

    // Check if room has active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        roomId: Number(id),
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    })

    // Check if room has active monthly renters
    const activeRenters = await prisma.monthlyRenter.count({
      where: {
        roomId: Number(id),
        status: "ACTIVE",
      },
    })

    if (activeBookings > 0 || activeRenters > 0) {
      return res.status(400).json({
        message: "Cannot delete room with active bookings or monthly renters",
      })
    }

    await prisma.room.delete({
      where: { id: Number(id) },
    })

    res.status(200).json({
      message: "Room deleted successfully",
    })
  } catch (error) {
    console.error("Delete room error:", error)
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}
