-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` CHAR(36) NOT NULL,
    `address_id` INTEGER NULL,
    `order_number` VARCHAR(100) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `payment_status` VARCHAR(50) NOT NULL,
    `recipient_name` VARCHAR(255) NOT NULL,
    `recipient_phone` VARCHAR(20) NOT NULL,
    `shipping_address` TEXT NOT NULL,
    `normal_subtotal` DOUBLE NOT NULL,
    `discount_total` DOUBLE NOT NULL DEFAULT 0,
    `items_subtotal` DOUBLE NOT NULL,
    `shipping_fee` DOUBLE NOT NULL DEFAULT 0,
    `grand_total` DOUBLE NOT NULL,
    `total_cost` DOUBLE NOT NULL DEFAULT 0,
    `gross_profit` DOUBLE NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `paid_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,

    UNIQUE INDEX `orders_order_number_key`(`order_number`),
    INDEX `orders_user_id_idx`(`user_id`),
    INDEX `orders_status_idx`(`status`),
    INDEX `orders_payment_status_idx`(`payment_status`),
    INDEX `orders_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `product_image_url` VARCHAR(255) NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DOUBLE NOT NULL,
    `discount_amount` INTEGER NOT NULL DEFAULT 0,
    `final_unit_price` DOUBLE NOT NULL,
    `normal_subtotal` DOUBLE NOT NULL,
    `discount_subtotal` DOUBLE NOT NULL DEFAULT 0,
    `subtotal` DOUBLE NOT NULL,
    `unit_cost` DOUBLE NOT NULL DEFAULT 0,
    `total_cost` DOUBLE NOT NULL DEFAULT 0,
    `gross_profit` DOUBLE NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `order_items_order_id_idx`(`order_id`),
    INDEX `order_items_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
