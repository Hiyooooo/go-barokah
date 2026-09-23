ALTER TABLE `cash_sales`
  ADD COLUMN `snap_token` TEXT NULL,
  ADD COLUMN `payment_url` VARCHAR(500) NULL,
  ADD COLUMN `midtrans_order_id` VARCHAR(150) NULL;

CREATE UNIQUE INDEX `cash_sales_midtrans_order_id_key` ON `cash_sales`(`midtrans_order_id`);
