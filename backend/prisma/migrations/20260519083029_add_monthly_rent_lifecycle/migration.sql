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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MonthlyRenter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MonthlyRenter_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MonthlyRenter_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MonthlyRenter" ("bookingId", "createdAt", "id", "joinDate", "lastPaidDate", "nextDueDate", "rentAmount", "roomId", "securityAmount", "status", "stayStatus", "updatedAt", "userId") SELECT "bookingId", "createdAt", "id", "joinDate", "lastPaidDate", "nextDueDate", "rentAmount", "roomId", "securityAmount", "status", "stayStatus", "updatedAt", "userId" FROM "MonthlyRenter";
DROP TABLE "MonthlyRenter";
ALTER TABLE "new_MonthlyRenter" RENAME TO "MonthlyRenter";
CREATE UNIQUE INDEX "MonthlyRenter_bookingId_key" ON "MonthlyRenter"("bookingId");
CREATE INDEX "MonthlyRenter_userId_idx" ON "MonthlyRenter"("userId");
CREATE INDEX "MonthlyRenter_roomId_idx" ON "MonthlyRenter"("roomId");
CREATE INDEX "MonthlyRenter_status_idx" ON "MonthlyRenter"("status");
CREATE INDEX "MonthlyRenter_nextDueDate_idx" ON "MonthlyRenter"("nextDueDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
