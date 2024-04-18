-- CreateEnum
CREATE TYPE "CafeStatus" AS ENUM ('Unprepared', 'Preparing', 'Brewing', 'Fermenting', 'PendingDelivery', 'Delivering', 'Delivered', 'Cancelled', 'Deleted', 'Failed', 'Claimed');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('Unprepared', 'Preparing', 'Brewing', 'Fermenting', 'PendingDelivery', 'Delivering', 'Delivered', 'Cancelled', 'Deleted', 'Failed', 'Claimed');

-- CreateTable
CREATE TABLE "WorkerInfo" (
    "id" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preparations" INTEGER NOT NULL DEFAULT 0,
    "deliveries" INTEGER NOT NULL DEFAULT 0,
    "deliveryMessage" TEXT,
    "commandUsageCount" INTEGER NOT NULL,
    "lastCommandName" TEXT,
    "cafeDeliveryMessage" TEXT,

    CONSTRAINT "WorkerInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInfo" (
    "id" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "newBalance" INTEGER,
    "tabLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "donuts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trees" (
    "id" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "water" TIMESTAMP(3) NOT NULL,
    "maxAge" INTEGER NOT NULL,

    CONSTRAINT "trees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tab" (
    "id" SERIAL NOT NULL,
    "userId" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "amount" DOUBLE PRECISION NOT NULL,
    "tabLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountNeeded" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountRemaining" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Tab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blacklist" (
    "id" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "blacklister" VARCHAR(20) NOT NULL,

    CONSTRAINT "Blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CafeOrders" (
    "id" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user" VARCHAR(20) NOT NULL,
    "details" TEXT NOT NULL,
    "status" "CafeStatus" NOT NULL DEFAULT 'Unprepared',
    "channel" VARCHAR(20) NOT NULL,
    "guild" VARCHAR(20) NOT NULL,
    "claimer" VARCHAR(20),
    "deliverer" VARCHAR(20),
    "image" TEXT,
    "timeout" TIMESTAMP(3),
    "deleteReason" TEXT,
    "bakeRating" INTEGER,
    "prepRating" INTEGER,
    "deliveryRating" INTEGER,
    "flags" INTEGER NOT NULL DEFAULT 0,
    "putOnTab" BOOLEAN,
    "amount" DOUBLE PRECISION,

    CONSTRAINT "CafeOrders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orders" (
    "id" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user" VARCHAR(20) NOT NULL,
    "details" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'Unprepared',
    "channel" VARCHAR(20) NOT NULL,
    "guild" VARCHAR(20) NOT NULL,
    "claimer" VARCHAR(20),
    "deliverer" VARCHAR(20),
    "image" TEXT,
    "timeout" TIMESTAMP(3),
    "deleteReason" TEXT,
    "bakeRating" INTEGER,
    "prepRating" INTEGER,
    "deliveryRating" INTEGER,
    "flags" INTEGER NOT NULL DEFAULT 0,
    "putOnTab" BOOLEAN,
    "amount" DOUBLE PRECISION,

    CONSTRAINT "Orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dishes" (
    "id" VARCHAR(1234) NOT NULL,
    "status" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "dishes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildsXP" (
    "userId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "exp" INTEGER NOT NULL DEFAULT 0,
    "notificationChannelId" TEXT
);

-- CreateTable
CREATE TABLE "WorkerStats" (
    "id" TEXT NOT NULL,
    "ordersBrewed" INTEGER NOT NULL,
    "ordersDelivered" INTEGER NOT NULL,
    "lastUsed" TIMESTAMP(3) NOT NULL,
    "lastCommand" TEXT,

    CONSTRAINT "WorkerStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "roleId" TEXT,

    CONSTRAINT "ShopItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tab_userId_key" ON "Tab"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuildsXP_userId_guildId_key" ON "GuildsXP"("userId", "guildId");

-- AddForeignKey
ALTER TABLE "Tab" ADD CONSTRAINT "Tab_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
