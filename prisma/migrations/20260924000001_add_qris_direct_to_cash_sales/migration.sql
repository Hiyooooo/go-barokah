ALTER TABLE `cash_sales`
  ADD COLUMN `qr_string` TEXT NULL,
  ADD COLUMN `qr_code_url` VARCHAR(500) NULL,
  ADD COLUMN `expiry_time` DATETIME(3) NULL;
