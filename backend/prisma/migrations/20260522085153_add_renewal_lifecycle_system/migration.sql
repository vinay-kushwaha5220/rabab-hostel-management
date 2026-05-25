-- CreateTable
CREATE TABLE "StayRenewalRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bookingId" INTEGER NOT NULL,
    "monthlyRenterId" INTEGER NOT NULL,
    "requestType" TEXT NOT NULL DEFAULT 'CONTINUE_STAY',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decisionDate" DATETIME,
    "decidedByAdminId" INTEGER,
    "rejectionReason" TEXT,
    "approvalNotes" TEXT,
    "generatedBillId" INTEGER,
    "nextCycleStart" DATETIME,
    "nextCycleEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StayRenewalRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StayRenewalRequest_monthlyRenterId_fkey" FOREIGN KEY ("monthlyRenterId") REFERENCES "MonthlyRenter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MonthlyRenter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "joinDate" DATETIME NOT NULL,
    "lastPaidDate" DATETIME,
    "currentCycleStart" DATETIME,
    "currentCycleEnd" DATETIME,
    "dueDate" DATETIME,
    "nextDueDate" DATETIME NOT NULL,
    "stayStatus" TEXT NOT NULL DEFAULT 'CHECKED_IN',
    "rentAmount" REAL NOT NULL,
    "securityAmount" REAL NOT NULL DEFAULT 2500,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "pendingAmount" REAL NOT NULL DEFAULT 0,
    "overdueDays" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "paymentStatus" TEXT DEFAULT 'PENDING',
    "renewalRequestDate" DATETIME,
    "renewalDecisionDate" DATETIME,
    "checkoutRequestDate" DATETIME,
    "latePenalty" REAL NOT NULL DEFAULT 0,
    "lastElectricityAmount" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MonthlyRenter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MonthlyRenter_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MonthlyRenter_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MonthlyRenter" ("bookingId", "createdAt", "currentCycleEnd", "currentCycleStart", "dueDate", "id", "joinDate", "lastPaidDate", "nextDueDate", "overdueDays", "paidAmount", "paymentStatus", "pendingAmount", "rentAmount", "roomId", "securityAmount", "status", "stayStatus", "updatedAt", "userId") SELECT "bookingId", "createdAt", "currentCycleEnd", "currentCycleStart", "dueDate", "id", "joinDate", "lastPaidDate", "nextDueDate", "overdueDays", "paidAmount", "paymentStatus", "pendingAmount", "rentAmount", "roomId", "securityAmount", "status", "stayStatus", "updatedAt", "userId" FROM "MonthlyRenter";
DROP TABLE "MonthlyRenter";
ALTER TABLE "new_MonthlyRenter" RENAME TO "MonthlyRenter";
CREATE UNIQUE INDEX "MonthlyRenter_bookingId_key" ON "MonthlyRenter"("bookingId");
CREATE INDEX "MonthlyRenter_userId_idx" ON "MonthlyRenter"("userId");
CREATE INDEX "MonthlyRenter_roomId_idx" ON "MonthlyRenter"("roomId");
CREATE INDEX "MonthlyRenter_status_idx" ON "MonthlyRenter"("status");
CREATE INDEX "MonthlyRenter_nextDueDate_idx" ON "MonthlyRenter"("nextDueDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "StayRenewalRequest_bookingId_idx" ON "StayRenewalRequest"("bookingId");

-- CreateIndex
CREATE INDEX "StayRenewalRequest_monthlyRenterId_idx" ON "StayRenewalRequest"("monthlyRenterId");

-- CreateIndex
CREATE INDEX "StayRenewalRequest_status_idx" ON "StayRenewalRequest"("status");

-- CreateIndex
CREATE INDEX "StayRenewalRequest_requestDate_idx" ON "StayRenewalRequest"("requestDate");
