/*
  Warnings:

  - The values [wonen] on the enum `UserGender` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `image` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `statusAc` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `AnonymousUserModel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Cart` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MessageModel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PasswordChange` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupportChat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CartToProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProductCategories` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[socketId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `author_id` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipient_id` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('new', 'used');

-- CreateEnum
CREATE TYPE "AdvertisementStatus" AS ENUM ('active', 'sold', 'deleted', 'onModeration', 'moderationRejected');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('muted', 'unmuted');

-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('active', 'hidden', 'deleted', 'archived');

-- AlterEnum
BEGIN;
CREATE TYPE "UserGender_new" AS ENUM ('man', 'woman', 'other');
ALTER TABLE "User" ALTER COLUMN "gender" TYPE "UserGender_new" USING ("gender"::text::"UserGender_new");
ALTER TYPE "UserGender" RENAME TO "UserGender_old";
ALTER TYPE "UserGender_new" RENAME TO "UserGender";
DROP TYPE "UserGender_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "AnonymousUserModel" DROP CONSTRAINT "AnonymousUserModel_userId_fkey";

-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_userId_fkey";

-- DropForeignKey
ALTER TABLE "MessageModel" DROP CONSTRAINT "MessageModel_chatId_fkey";

-- DropForeignKey
ALTER TABLE "PasswordChange" DROP CONSTRAINT "PasswordChange_userId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_createUserId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_product_id_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_user_id_fkey";

-- DropForeignKey
ALTER TABLE "SupportChat" DROP CONSTRAINT "SupportChat_anonimId_fkey";

-- DropForeignKey
ALTER TABLE "SupportChat" DROP CONSTRAINT "SupportChat_supportUserId_fkey";

-- DropForeignKey
ALTER TABLE "SupportChat" DROP CONSTRAINT "SupportChat_userId_fkey";

-- DropForeignKey
ALTER TABLE "_CartToProduct" DROP CONSTRAINT "_CartToProduct_A_fkey";

-- DropForeignKey
ALTER TABLE "_CartToProduct" DROP CONSTRAINT "_CartToProduct_B_fkey";

-- DropForeignKey
ALTER TABLE "_ProductCategories" DROP CONSTRAINT "_ProductCategories_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProductCategories" DROP CONSTRAINT "_ProductCategories_B_fkey";

-- DropIndex
DROP INDEX "Category_id_idx";

-- DropIndex
DROP INDEX "Review_id_idx";

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "image",
DROP COLUMN "product_id",
DROP COLUMN "user_id",
ADD COLUMN     "author_id" TEXT NOT NULL,
ADD COLUMN     "recipient_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isActive",
DROP COLUMN "statusAc",
ADD COLUMN     "accountStatus" "UserStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "socketId" TEXT;

-- DropTable
DROP TABLE "AnonymousUserModel";

-- DropTable
DROP TABLE "Cart";

-- DropTable
DROP TABLE "MessageModel";

-- DropTable
DROP TABLE "PasswordChange";

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "SupportChat";

-- DropTable
DROP TABLE "_CartToProduct";

-- DropTable
DROP TABLE "_ProductCategories";

-- DropEnum
DROP TYPE "StateChatUserAndAdminModel";

-- CreateTable
CREATE TABLE "Advertisement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION,
    "location" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "images" TEXT[],
    "views" INTEGER NOT NULL DEFAULT 0,
    "status" "AdvertisementStatus" NOT NULL DEFAULT 'onModeration',
    "type" "ItemType" NOT NULL,
    "favorites" INTEGER NOT NULL DEFAULT 0,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Advertisement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favourite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Favourite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForgotPassword" (
    "id" TEXT NOT NULL,
    "resetPasswordToken" TEXT NOT NULL,
    "resetPasswordExpires" INTEGER NOT NULL DEFAULT 1500,
    "timeCreatetoken" TIMESTAMP(3)[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "youResert" BOOLEAN NOT NULL DEFAULT false,
    "lastResetPasword" TIMESTAMP(3),

    CONSTRAINT "ForgotPassword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "chatName" TEXT NOT NULL,
    "initiatorId" TEXT,
    "participantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserChatStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "chatStatus" "ChatStatus" NOT NULL DEFAULT 'active',
    "notificationStatus" "NotificationStatus" NOT NULL DEFAULT 'unmuted',

    CONSTRAINT "UserChatStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "chatName" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" TEXT,
    "url" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BannedWord" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BannedWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AdvertisementToFavourite" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Favourite_userId_key" ON "Favourite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ForgotPassword_resetPasswordToken_key" ON "ForgotPassword"("resetPasswordToken");

-- CreateIndex
CREATE UNIQUE INDEX "ForgotPassword_userId_key" ON "ForgotPassword"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_chatName_key" ON "Chat"("chatName");

-- CreateIndex
CREATE UNIQUE INDEX "BannedWord_word_key" ON "BannedWord"("word");

-- CreateIndex
CREATE UNIQUE INDEX "_AdvertisementToFavourite_AB_unique" ON "_AdvertisementToFavourite"("A", "B");

-- CreateIndex
CREATE INDEX "_AdvertisementToFavourite_B_index" ON "_AdvertisementToFavourite"("B");

-- CreateIndex
CREATE UNIQUE INDEX "User_socketId_key" ON "User"("socketId");

-- AddForeignKey
ALTER TABLE "Advertisement" ADD CONSTRAINT "Advertisement_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advertisement" ADD CONSTRAINT "Advertisement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favourite" ADD CONSTRAINT "Favourite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForgotPassword" ADD CONSTRAINT "ForgotPassword_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChatStatus" ADD CONSTRAINT "UserChatStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChatStatus" ADD CONSTRAINT "UserChatStatus_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdvertisementToFavourite" ADD CONSTRAINT "_AdvertisementToFavourite_A_fkey" FOREIGN KEY ("A") REFERENCES "Advertisement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdvertisementToFavourite" ADD CONSTRAINT "_AdvertisementToFavourite_B_fkey" FOREIGN KEY ("B") REFERENCES "Favourite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
