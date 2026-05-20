/*
  Warnings:

  - You are about to drop the column `departmentId` on the `Project` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_departmentId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "departmentId";

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "departmentId" INTEGER;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
