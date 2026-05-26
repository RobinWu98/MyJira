-- Preserve task creator as first-class task data before removing projects.
ALTER TABLE "Task" ADD COLUMN "createdByPersonId" INTEGER;

UPDATE "Task" AS task
SET "createdByPersonId" = created_log."actorId"
FROM (
  SELECT DISTINCT ON ("taskId") "taskId", "actorId"
  FROM "TaskLog"
  WHERE "type" = 'TASK_CREATED'
  ORDER BY "taskId", "createdAt" ASC
) AS created_log
WHERE task."id" = created_log."taskId";

UPDATE "Task" AS task
SET "createdByPersonId" = project."createdByPersonId"
FROM "Project" AS project
WHERE task."createdByPersonId" IS NULL
  AND task."projectId" = project."id";

DROP INDEX IF EXISTS "Task_projectId_status_sortOrder_idx";

ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_projectId_fkey";
ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_createdByPersonId_fkey";

ALTER TABLE "Task"
  ADD CONSTRAINT "Task_createdByPersonId_fkey"
  FOREIGN KEY ("createdByPersonId") REFERENCES "Person"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Task_status_sortOrder_idx" ON "Task"("status", "sortOrder");

ALTER TABLE "Task" DROP COLUMN "projectId";
DROP TABLE "Project";
