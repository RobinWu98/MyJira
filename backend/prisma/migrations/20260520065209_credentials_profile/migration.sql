-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'USER');

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "contactNumber" TEXT,
ADD COLUMN     "passwordHash" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';
