-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "ActivityLog" ADD COLUMN "newValue" TEXT;
ALTER TABLE "ActivityLog" ADD COLUMN "oldValue" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastLoginAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MaintenanceRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "issue" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT,
    "imageUrl" TEXT,
    "assignedToId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    CONSTRAINT "MaintenanceRequest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MaintenanceRequest" ("createdAt", "deletedAt", "id", "isDeleted", "issue", "roomId", "status", "updatedAt", "userId") SELECT "createdAt", "deletedAt", "id", "isDeleted", "issue", "roomId", "status", "updatedAt", "userId" FROM "MaintenanceRequest";
DROP TABLE "MaintenanceRequest";
ALTER TABLE "new_MaintenanceRequest" RENAME TO "MaintenanceRequest";
CREATE INDEX "MaintenanceRequest_roomId_idx" ON "MaintenanceRequest"("roomId");
CREATE INDEX "MaintenanceRequest_userId_idx" ON "MaintenanceRequest"("userId");
CREATE INDEX "MaintenanceRequest_status_idx" ON "MaintenanceRequest"("status");
CREATE TABLE "new_Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "bookingId" INTEGER,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SYSTEM',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "actionUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("actionUrl", "bookingId", "createdAt", "deletedAt", "id", "isDeleted", "isRead", "message", "priority", "readAt", "title", "type", "userId") SELECT "actionUrl", "bookingId", "createdAt", "deletedAt", "id", "isDeleted", "isRead", "message", "priority", "readAt", "title", "type", "userId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE TABLE "new_Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bookingId" INTEGER NOT NULL,
    "monthlyBillId" INTEGER,
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "transactionId" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "receiptUrl" TEXT,
    "invoiceNumber" TEXT,
    "refundAmount" REAL,
    "refundReason" TEXT,
    "refundedAt" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "verificationStatus" TEXT,
    "verifiedBy" INTEGER,
    "verifiedAt" DATETIME,
    "verificationNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_monthlyBillId_fkey" FOREIGN KEY ("monthlyBillId") REFERENCES "MonthlyBill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "bookingId", "createdAt", "deletedAt", "id", "invoiceNumber", "isDeleted", "monthlyBillId", "paymentMethod", "paymentStatus", "receiptUrl", "transactionId", "updatedAt", "verificationNotes", "verificationStatus", "verifiedAt", "verifiedBy") SELECT "amount", "bookingId", "createdAt", "deletedAt", "id", "invoiceNumber", "isDeleted", "monthlyBillId", "paymentMethod", "paymentStatus", "receiptUrl", "transactionId", "updatedAt", "verificationNotes", "verificationStatus", "verifiedAt", "verifiedBy" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");
CREATE INDEX "Payment_paymentStatus_idx" ON "Payment"("paymentStatus");
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");
CREATE INDEX "Payment_verificationStatus_idx" ON "Payment"("verificationStatus");
CREATE INDEX "Payment_bookingId_paymentStatus_idx" ON "Payment"("bookingId", "paymentStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Booking_userId_status_idx" ON "Booking"("userId", "status");

-- CreateIndex
CREATE INDEX "Booking_roomId_checkInDate_idx" ON "Booking"("roomId", "checkInDate");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_idx" ON "Message"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "MonthlyBill_bookingId_month_idx" ON "MonthlyBill"("bookingId", "month");
