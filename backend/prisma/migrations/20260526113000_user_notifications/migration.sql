CREATE TABLE "UserNotification" (
  "id" SERIAL NOT NULL,
  "recipientId" INTEGER NOT NULL,
  "senderId" INTEGER,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),
  CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserNotification_recipientId_isRead_createdAt_idx"
ON "UserNotification"("recipientId", "isRead", "createdAt");

ALTER TABLE "UserNotification"
ADD CONSTRAINT "UserNotification_recipientId_fkey"
FOREIGN KEY ("recipientId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserNotification"
ADD CONSTRAINT "UserNotification_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
