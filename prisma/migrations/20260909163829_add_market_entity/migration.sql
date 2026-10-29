/*
  Warnings:

  - You are about to drop the column `location` on the `marketprice` table. All the data in the column will be lost.
  - You are about to drop the column `marketName` on the `marketprice` table. All the data in the column will be lost.
  - Added the required column `marketId` to the `MarketPrice` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `MarketPrice_marketName_recordedAt_idx` ON `marketprice`;

-- AlterTable
ALTER TABLE `marketprice` DROP COLUMN `location`,
    DROP COLUMN `marketName`,
    ADD COLUMN `marketId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `Market` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Market_name_location_key`(`name`, `location`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `MarketPrice_marketId_recordedAt_idx` ON `MarketPrice`(`marketId`, `recordedAt`);

-- AddForeignKey
ALTER TABLE `MarketPrice` ADD CONSTRAINT `MarketPrice_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
