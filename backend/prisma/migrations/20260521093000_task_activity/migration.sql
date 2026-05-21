-- CreateEnum
CREATE TYPE "TaskLogType" AS ENUM ('TASK_CREATED', 'ASSIGNEE_CHANGED', 'PRIORITY_CHANGED', 'NOTE');

-- CreateTable
CREATE TABLE "TaskLog" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "actorId" INTEGER,
    "type" "TaskLogType" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskLog_taskId_createdAt_idx" ON "TaskLog"("taskId", "createdAt");

-- AddForeignKey
ALTER TABLE "TaskLog" ADD CONSTRAINT "TaskLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskLog" ADD CONSTRAINT "TaskLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
