/*
  Warnings:

  - You are about to drop the `email_otp` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[midtrans_order_id]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `email_otp` DROP FOREIGN KEY `email_otp_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_product_id_fkey`;

-- AlterTable
ALTER TABLE `order_items` MODIFY `product_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `midtrans_order_id` VARCHAR(150) NULL,
    ADD COLUMN `payment_url` VARCHAR(500) NULL,
    ADD COLUMN `snap_token` TEXT NULL,
    ADD COLUMN `snap_token_created_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `cost` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `critical_stock` INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `min_order_quantity` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `phone_number_verified` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `password` VARCHAR(255) NULL;

-- DropTable
DROP TABLE `email_otp`;

-- CreateTable
CREATE TABLE `otps` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` CHAR(36) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `target` VARCHAR(255) NULL,
    `otp_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `otps_user_id_type_idx`(`user_id`, `type`),
    INDEX `otps_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `date` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `expenses_date_idx`(`date`),
    INDEX `expenses_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `orders_midtrans_order_id_key` ON `orders`(`midtrans_order_id`);

-- AddForeignKey
ALTER TABLE `otps` ADD CONSTRAINT `otps_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
