-- AlterTable
ALTER TABLE `orders` ADD COLUMN `fulfillment_method` VARCHAR(50) NOT NULL DEFAULT 'DELIVERY';

-- CreateIndex
CREATE INDEX `orders_fulfillment_method_idx` ON `orders`(`fulfillment_method`);
