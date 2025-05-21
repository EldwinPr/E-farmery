/*
  Warnings:

  - Added the required column `user` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user` to the `Schedule` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_userId_fkey";

-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_userId_fkey";

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "user" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "user" TEXT NOT NULL;
