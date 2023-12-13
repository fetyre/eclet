-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('GOOGLE', 'FACEBOOK', 'GITHUB');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin', 'superAdmin', 'anonim');

-- CreateEnum
CREATE TYPE "UserGender" AS ENUM ('man', 'wonen', 'other');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'pending', 'blocked');

-- CreateEnum
CREATE TYPE "ClassToken" AS ENUM ('access', 'refresh', 'confirmation', 'resetPassword');

-- CreateEnum
CREATE TYPE "StatusEnum" AS ENUM ('offline', 'online');

-- CreateEnum
CREATE TYPE "StateChatUserAndAdminModel" AS ENUM ('expectation', 'inProgress', 'completed');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "image" TEXT[],
    "quantity" INTEGER NOT NULL,
    "seller" TEXT NOT NULL,
    "createUserId" TEXT NOT NULL,
    "popularity" INTEGER,
    "rating" INTEGER,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "text" TEXT,
    "rating" INTEGER NOT NULL,
    "image" TEXT[],
    "product_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "gender" "UserGender",
    "phoneNumber" TEXT,
    "sesionId" TEXT,
    "status" "StatusEnum" NOT NULL DEFAULT 'online',
    "dateOfBirth" TIMESTAMP(3),
    "statusAc" "UserStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "provider" "Provider",

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,
    "lastRestEmail" TIMESTAMP(3),
    "code" TEXT NOT NULL,
    "lastAttemptMessage" TIMESTAMP(3)[],

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryAddressModel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "country" TEXT DEFAULT 'Belarus',
    "postal_code" INTEGER NOT NULL,
    "street" TEXT,
    "alley" TEXT,
    "village" TEXT,
    "city" TEXT,
    "region" TEXT,
    "district" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "buildingNumber" TEXT,
    "apartmentNumber" INTEGER,
    "entrance" INTEGER,
    "floor" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryAddressModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordChange" (
    "id" TEXT NOT NULL,
    "resetPasswordToken" TEXT NOT NULL,
    "resetPasswordExpires" INTEGER NOT NULL DEFAULT 1500,
    "timeCreatetoken" TIMESTAMP(3)[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "youResert" BOOLEAN NOT NULL DEFAULT false,
    "lastResetPasword" TIMESTAMP(3),

    CONSTRAINT "PasswordChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "discountCode" TEXT,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordLast" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "passwordVersion" INTEGER NOT NULL DEFAULT 0,
    "updateAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderModel" (
    "String" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerName" "Provider" NOT NULL,
    "refreshToken" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderModel_pkey" PRIMARY KEY ("String")
);

-- CreateTable
CREATE TABLE "EmailToken" (
    "id" TEXT NOT NULL,
    "token" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresIn" INTEGER NOT NULL DEFAULT 3600000,
    "emailResendAttempts" TIMESTAMP(3)[],
    "lastEmailResendAttempt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlacklistedToken" (
    "tokenId" TEXT NOT NULL,
    "exp" INTEGER NOT NULL,
    "tokenV4Id" TEXT NOT NULL,
    "updateAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classToken" "ClassToken" NOT NULL,

    CONSTRAINT "BlacklistedToken_pkey" PRIMARY KEY ("tokenId")
);

-- CreateTable
CREATE TABLE "EmailChange" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,
    "lastRestEmail" TIMESTAMP(3),
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "lastAttemptMessage" TIMESTAMP(3)[],

    CONSTRAINT "EmailChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportUserModel" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" "StatusEnum" NOT NULL DEFAULT 'online',
    "role" "UserRole" NOT NULL DEFAULT 'admin',
    "socetID" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportUserModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfirmEmainAdminModel" (
    "id" TEXT NOT NULL,
    "supportUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,
    "code" TEXT NOT NULL,
    "attempt" TIMESTAMP(3),

    CONSTRAINT "ConfirmEmainAdminModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportChat" (
    "id" TEXT NOT NULL,
    "chatName" TEXT NOT NULL,
    "supportUserId" TEXT,
    "userId" TEXT,
    "anonimId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,
    "state" "StateChatUserAndAdminModel" NOT NULL DEFAULT 'expectation',
    "grade" INTEGER,

    CONSTRAINT "SupportChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageModel" (
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

    CONSTRAINT "MessageModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousUserModel" (
    "id" TEXT NOT NULL,
    "sesionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnonymousUserModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportFeedback" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completedChats" INTEGER NOT NULL,
    "completedChatsFeedback" INTEGER NOT NULL,
    "averageRating" DECIMAL(2,1) NOT NULL,
    "interestFeedback" DECIMAL(3,1) NOT NULL,

    CONSTRAINT "SupportFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CartToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Product_id_idx" ON "Product"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_id_idx" ON "Category"("id");

-- CreateIndex
CREATE INDEX "Review_id_idx" ON "Review"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_sesionId_key" ON "User"("sesionId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_userId_key" ON "PasswordReset"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryAddressModel_userId_key" ON "DeliveryAddressModel"("userId");

-- CreateIndex
CREATE INDEX "DeliveryAddressModel_id_idx" ON "DeliveryAddressModel"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordChange_resetPasswordToken_key" ON "PasswordChange"("resetPasswordToken");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordChange_userId_key" ON "PasswordChange"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Credentials_userId_key" ON "Credentials"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderModel_providerId_key" ON "ProviderModel"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailToken_token_key" ON "EmailToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "EmailToken_userId_key" ON "EmailToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BlacklistedToken_tokenId_userId_key" ON "BlacklistedToken"("tokenId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailChange_userId_key" ON "EmailChange"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportUserModel_email_key" ON "SupportUserModel"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SupportUserModel_socetID_key" ON "SupportUserModel"("socetID");

-- CreateIndex
CREATE UNIQUE INDEX "ConfirmEmainAdminModel_supportUserId_key" ON "ConfirmEmainAdminModel"("supportUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportChat_chatName_key" ON "SupportChat"("chatName");

-- CreateIndex
CREATE INDEX "MessageModel_id_idx" ON "MessageModel"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousUserModel_sesionId_key" ON "AnonymousUserModel"("sesionId");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousUserModel_userId_key" ON "AnonymousUserModel"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_ProductCategories_AB_unique" ON "_ProductCategories"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductCategories_B_index" ON "_ProductCategories"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CartToProduct_AB_unique" ON "_CartToProduct"("A", "B");

-- CreateIndex
CREATE INDEX "_CartToProduct_B_index" ON "_CartToProduct"("B");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_createUserId_fkey" FOREIGN KEY ("createUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryAddressModel" ADD CONSTRAINT "DeliveryAddressModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordChange" ADD CONSTRAINT "PasswordChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credentials" ADD CONSTRAINT "Credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderModel" ADD CONSTRAINT "ProviderModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailToken" ADD CONSTRAINT "EmailToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlacklistedToken" ADD CONSTRAINT "BlacklistedToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailChange" ADD CONSTRAINT "EmailChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfirmEmainAdminModel" ADD CONSTRAINT "ConfirmEmainAdminModel_supportUserId_fkey" FOREIGN KEY ("supportUserId") REFERENCES "SupportUserModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportChat" ADD CONSTRAINT "SupportChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportChat" ADD CONSTRAINT "SupportChat_supportUserId_fkey" FOREIGN KEY ("supportUserId") REFERENCES "SupportUserModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportChat" ADD CONSTRAINT "SupportChat_anonimId_fkey" FOREIGN KEY ("anonimId") REFERENCES "AnonymousUserModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageModel" ADD CONSTRAINT "MessageModel_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "SupportChat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousUserModel" ADD CONSTRAINT "AnonymousUserModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductCategories" ADD CONSTRAINT "_ProductCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductCategories" ADD CONSTRAINT "_ProductCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CartToProduct" ADD CONSTRAINT "_CartToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CartToProduct" ADD CONSTRAINT "_CartToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
