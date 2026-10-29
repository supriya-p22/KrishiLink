-- CreateTable
CREATE TABLE `SaleIntent` (
    `id` VARCHAR(191) NOT NULL,
    `farmerCropId` VARCHAR(191) NOT NULL,
    `buyerDemandId` VARCHAR(191) NOT NULL,
    `buyerId` VARCHAR(191) NOT NULL,
    `cropId` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(12, 2) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `agreedPrice` DECIMAL(12, 2) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SaleIntent_farmerCropId_idx`(`farmerCropId`),
    INDEX `SaleIntent_buyerDemandId_idx`(`buyerDemandId`),
    INDEX `SaleIntent_buyerId_idx`(`buyerId`),
    INDEX `SaleIntent_cropId_idx`(`cropId`),
    INDEX `SaleIntent_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SaleIntent` ADD CONSTRAINT `SaleIntent_farmerCropId_fkey` FOREIGN KEY (`farmerCropId`) REFERENCES `FarmerCrop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleIntent` ADD CONSTRAINT `SaleIntent_buyerDemandId_fkey` FOREIGN KEY (`buyerDemandId`) REFERENCES `BuyerDemand`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleIntent` ADD CONSTRAINT `SaleIntent_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `Buyer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleIntent` ADD CONSTRAINT `SaleIntent_cropId_fkey` FOREIGN KEY (`cropId`) REFERENCES `Crop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
