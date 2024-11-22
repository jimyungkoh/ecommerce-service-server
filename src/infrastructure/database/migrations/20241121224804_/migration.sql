/*
  Warnings:

  - A unique constraint covering the columns `[aggregate_id,event_type]` on the table `outbox_event` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `idx_outbox_event_aggregate_id_event_type` ON `outbox_event`;

-- CreateIndex
CREATE INDEX `idx_outbox_event_aggregate_id` ON `outbox_event`(`aggregate_id`);

-- CreateIndex
CREATE UNIQUE INDEX `idx_outbox_event_aggregate_id_event_type` ON `outbox_event`(`aggregate_id`, `event_type`);
