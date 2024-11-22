/*
  Warnings:

  - The values [PURCHASE] on the enum `point_transaction_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `point` MODIFY `transaction_type` ENUM('CHARGE', 'WITHDRAW', 'USE', 'REFUND', 'CASHBACK', 'PROMOTION_CREDIT', 'EXPIRATION', 'GIFT_SENT', 'GIFT_RECEIVED') NOT NULL DEFAULT 'CHARGE';
