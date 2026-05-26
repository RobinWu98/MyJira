CREATE TABLE "TaskNotification" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "recipientId" INTEGER NOT NULL,
    "actorId" INTEGER,
    "taskLogId" INTEGER,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "TaskNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaskNotification_recipientId_isRead_createdAt_idx" ON "TaskNotification"("recipientId", "isRead", "createdAt");
CREATE INDEX "TaskNotification_taskId_recipientId_isRead_idx" ON "TaskNotification"("taskId", "recipientId", "isRead");

ALTER TABLE "TaskNotification" ADD CONSTRAINT "TaskNotification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskNotification" ADD CONSTRAINT "TaskNotification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
