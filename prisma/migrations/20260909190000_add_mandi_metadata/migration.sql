/*
  Warnings:

  - A unique constraint covering the columns `[name,state,district]` on the table `Market` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[observationKey]` on the table `MarketPrice` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `market` ADD COLUMN `district` VARCHAR(191) NULL,
    ADD COLUMN `state` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `marketprice` ADD COLUMN `arrivalDate` DATE NULL,
    ADD COLUMN `grade` VARCHAR(191) NULL,
    ADD COLUMN `maxPrice` DECIMAL(12, 2) NULL,
    ADD COLUMN `minPrice` DECIMAL(12, 2) NULL,
    ADD COLUMN `modalPrice` DECIMAL(12, 2) NULL,
    ADD COLUMN `observationKey` VARCHAR(191) NULL,
    ADD COLUMN `sourceName` VARCHAR(191) NULL,
    ADD COLUMN `sourceRecordId` VARCHAR(191) NULL,
    ADD COLUMN `variety` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Market_name_state_district_key` ON `Market`(`name`, `state`, `district`);

-- CreateIndex
CREATE UNIQUE INDEX `MarketPrice_observationKey_key` ON `MarketPrice`(`observationKey`);
