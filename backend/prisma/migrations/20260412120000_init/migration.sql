-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SiItemType" AS ENUM ('bill', 'subscription', 'insurance', 'loan', 'service');

-- CreateEnum
CREATE TYPE "SiPaymentFrequency" AS ENUM ('daily', 'weekly', 'monthly', 'bimonthly', 'quarterly', 'quadrimestral', 'semiannual', 'annually');

-- CreateTable
CREATE TABLE "SI_Items" (
    "id" TEXT NOT NULL,
    "type" "SiItemType" NOT NULL,
    "subType" TEXT,
    "paymentFrequency" "SiPaymentFrequency" NOT NULL,
    "amount" REAL NOT NULL,
    "notifyCancel" BOOLEAN NOT NULL,
    "notifyRenew" BOOLEAN NOT NULL,
    "notifyPay" BOOLEAN NOT NULL,
    "notifyCancelDate" TIMESTAMP(3),
    "notifyRenewDate" TIMESTAMP(3),
    "notifyPayDate" TIMESTAMP(3),

    CONSTRAINT "SI_Items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
