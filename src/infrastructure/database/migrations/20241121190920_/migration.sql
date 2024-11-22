/*
  Warnings:

  - You are about to alter the column `status` on the `outbox_event` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(2))`.

*/
-- AlterTable
ALTER TABLE `outbox_event` MODIFY `status` ENUM('INIT', 'SUCCESS', 'FAIL') NOT NULL DEFAULT 'INIT';
