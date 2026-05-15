-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bookingId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerAadhaar" TEXT,
    "customerAadhaarMasked" TEXT,
    "roomId" INTEGER NOT NULL,
    "bookingType" TEXT NOT NULL DEFAULT 'DAILY',
    "checkInDate" DATETIME NOT NULL,
    "checkOutDate" DATETIME NOT NULL,
    "numberOfGuests" INTEGER NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "totalAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "stayStatus" TEXT NOT NULL DEFAULT 'BOOKED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("bookingId", "checkInDate", "checkOutDate", "createdAt", "customerAadhaar", "customerAadhaarMasked", "customerEmail", "customerName", "customerPhone", "deletedAt", "id", "isDeleted", "numberOfGuests", "paymentStatus", "roomId", "status", "stayStatus", "totalAmount", "totalDays", "updatedAt", "userId") SELECT "bookingId", "checkInDate", "checkOutDate", "createdAt", "customerAadhaar", "customerAadhaarMasked", "customerEmail", "customerName", "customerPhone", "deletedAt", "id", "isDeleted", "numberOfGuests", "paymentStatus", "roomId", "status", "stayStatus", "totalAmount", "totalDays", "updatedAt", "userId" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE UNIQUE INDEX "Booking_bookingId_key" ON "Booking"("bookingId");
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX "Booking_roomId_idx" ON "Booking"("roomId");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");
CREATE INDEX "Booking_paymentStatus_idx" ON "Booking"("paymentStatus");
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");
CREATE INDEX "Booking_checkInDate_idx" ON "Booking"("checkInDate");
CREATE INDEX "Booking_checkOutDate_idx" ON "Booking"("checkOutDate");
CREATE INDEX "Booking_userId_status_idx" ON "Booking"("userId", "status");
CREATE INDEX "Booking_roomId_checkInDate_idx" ON "Booking"("roomId", "checkInDate");
CREATE TABLE "new_MonthlyBill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bookingId" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "rentAmount" REAL NOT NULL DEFAULT 0,
    "electricityAmount" REAL NOT NULL DEFAULT 0,
    "extraCharges" REAL NOT NULL DEFAULT 0,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "remainingAmount" REAL NOT NULL DEFAULT 0,
    "previousDue" REAL NOT NULL DEFAULT 0,
    "totalDue" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" DATETIME NOT NULL,
    "paidDate" DATETIME,
    "verificationStatus" TEXT,
    "verifiedBy" INTEGER,
    "verifiedAt" DATETIME,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "lastReminderAt" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MonthlyBill_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MonthlyBill" ("bookingId", "createdAt", "deletedAt", "dueDate", "electricityAmount", "extraCharges", "id", "isDeleted", "isPaid", "lastReminderAt", "month", "paidDate", "reminderSent", "rentAmount", "status", "totalAmount", "updatedAt", "verificationStatus", "verifiedAt", "verifiedBy") SELECT "bookingId", "createdAt", "deletedAt", "dueDate", "electricityAmount", "extraCharges", "id", "isDeleted", "isPaid", "lastReminderAt", "month", "paidDate", "reminderSent", "rentAmount", "status", "totalAmount", "updatedAt", "verificationStatus", "verifiedAt", "verifiedBy" FROM "MonthlyBill";
DROP TABLE "MonthlyBill";
ALTER TABLE "new_MonthlyBill" RENAME TO "MonthlyBill";
CREATE INDEX "MonthlyBill_bookingId_idx" ON "MonthlyBill"("bookingId");
CREATE INDEX "MonthlyBill_month_idx" ON "MonthlyBill"("month");
CREATE INDEX "MonthlyBill_status_idx" ON "MonthlyBill"("status");
CREATE INDEX "MonthlyBill_createdAt_idx" ON "MonthlyBill"("createdAt");
CREATE INDEX "MonthlyBill_bookingId_month_idx" ON "MonthlyBill"("bookingId", "month");
CREATE UNIQUE INDEX "MonthlyBill_bookingId_month_key" ON "MonthlyBill"("bookingId", "month");
CREATE TABLE "new_Room" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roomNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dailyPrice" REAL NOT NULL DEFAULT 0,
    "monthlyPrice" REAL NOT NULL DEFAULT 0,
    "price" REAL NOT NULL,
    "roomType" TEXT NOT NULL DEFAULT 'NON_AC',
    "bookingType" TEXT NOT NULL DEFAULT 'DAILY',
    "floor" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "images" TEXT,
    "amenities" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME
);
INSERT INTO "new_Room" ("amenities", "bookingType", "capacity", "createdAt", "currentOccupancy", "deletedAt", "description", "floor", "id", "images", "isAvailable", "isDeleted", "price", "roomNumber", "roomType", "title", "updatedAt") SELECT "amenities", "bookingType", "capacity", "createdAt", "currentOccupancy", "deletedAt", "description", "floor", "id", "images", "isAvailable", "isDeleted", "price", "roomNumber", "roomType", "title", "updatedAt" FROM "Room";
DROP TABLE "Room";
ALTER TABLE "new_Room" RENAME TO "Room";
CREATE UNIQUE INDEX "Room_roomNumber_key" ON "Room"("roomNumber");
CREATE INDEX "Room_roomType_idx" ON "Room"("roomType");
CREATE INDEX "Room_bookingType_idx" ON "Room"("bookingType");
CREATE INDEX "Room_floor_idx" ON "Room"("floor");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
