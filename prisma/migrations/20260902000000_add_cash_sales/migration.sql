CREATE TABLE `cash_sales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cashier_id` CHAR(36) NOT NULL,
    `sale_number` VARCHAR(100) NOT NULL,
    `payment_method` VARCHAR(30) NOT NULL DEFAULT 'CASH',
    `subtotal` DOUBLE NOT NULL,
    `discount_total` DOUBLE NOT NULL DEFAULT 0,
    `grand_total` DOUBLE NOT NULL,
    `cash_received` DOUBLE NOT NULL,
    `change_amount` DOUBLE NOT NULL,
    `total_cost` DOUBLE NOT NULL DEFAULT 0,
    `gross_profit` DOUBLE NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `cash_sales_sale_number_key`(`sale_number`),
    INDEX `cash_sales_cashier_id_idx`(`cashier_id`),
    INDEX `cash_sales_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cash_sale_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cash_sale_id` INTEGER NOT NULL,
    `product_id` INTEGER NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DOUBLE NOT NULL,
    `discount_amount` INTEGER NOT NULL DEFAULT 0,
    `final_unit_price` DOUBLE NOT NULL,
    `subtotal` DOUBLE NOT NULL,
    `total_cost` DOUBLE NOT NULL DEFAULT 0,
    `gross_profit` DOUBLE NOT NULL DEFAULT 0,
    INDEX `cash_sale_items_cash_sale_id_idx`(`cash_sale_id`),
    INDEX `cash_sale_items_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `cash_sales` ADD CONSTRAINT `cash_sales_cashier_id_fkey` FOREIGN KEY (`cashier_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cash_sale_items` ADD CONSTRAINT `cash_sale_items_cash_sale_id_fkey` FOREIGN KEY (`cash_sale_id`) REFERENCES `cash_sales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `cash_sale_items` ADD CONSTRAINT `cash_sale_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
