-- CreateTable
CREATE TABLE `PriceAlert` (
    `id` VARCHAR(191) NOT NULL,
    `farmerId` VARCHAR(191) NOT NULL,
    `cropId` VARCHAR(191) NOT NULL,
    `marketId` VARCHAR(191) NULL,
    `targetPrice` DECIMAL(12, 2) NOT NULL,
    `condition` ENUM('AT_OR_ABOVE', 'AT_OR_BELOW') NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `lastTriggeredObservationKey` VARCHAR(191) NULL,
    `lastTriggeredPrice` DECIMAL(12, 2) NULL,
    `lastTriggeredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PriceAlert_farmerId_idx`(`farmerId`),
    INDEX `PriceAlert_cropId_idx`(`cropId`),
    INDEX `PriceAlert_marketId_idx`(`marketId`),
    INDEX `PriceAlert_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PriceAlert` ADD CONSTRAINT `PriceAlert_farmerId_fkey` FOREIGN KEY (`farmerId`) REFERENCES `FarmerProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PriceAlert` ADD CONSTRAINT `PriceAlert_cropId_fkey` FOREIGN KEY (`cropId`) REFERENCES `Crop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PriceAlert` ADD CONSTRAINT `PriceAlert_marketId_fkey` FOREIGN KEY (`marketId`) REFERENCES `Market`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
