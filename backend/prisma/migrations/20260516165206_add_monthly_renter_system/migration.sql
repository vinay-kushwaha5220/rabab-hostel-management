-- CreateTable
CREATE TABLE "MonthlyRenter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "joinDate" DATETIME NOT NULL,
    "lastPaidDate" DATETIME,
    "nextDueDate" DATETIME NOT NULL,
    "stayStatus" TEXT NOT NULL DEFAULT 'CHECKED_IN',
    "rentAmount" REAL NOT NULL,
    "securityAmount" REAL NOT NULL DEFAULT 2500,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MonthlyRenter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MonthlyRenter_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MonthlyRenter_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyRenter_bookingId_key" ON "MonthlyRenter"("bookingId");

-- CreateIndex
CREATE INDEX "MonthlyRenter_userId_idx" ON "MonthlyRenter"("userId");

-- CreateIndex
CREATE INDEX "MonthlyRenter_roomId_idx" ON "MonthlyRenter"("roomId");

-- CreateIndex
CREATE INDEX "MonthlyRenter_status_idx" ON "MonthlyRenter"("status");

-- CreateIndex
CREATE INDEX "MonthlyRenter_nextDueDate_idx" ON "MonthlyRenter"("nextDueDate");
