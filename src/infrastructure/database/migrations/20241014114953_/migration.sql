-- AlterTable
ALTER TABLE "balance" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,2);

-- AlterTable
ALTER TABLE "balance_history" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,2);

-- AlterTable
ALTER TABLE "order" ALTER COLUMN "total_amount" SET DATA TYPE DECIMAL(65,2);

-- AlterTable
ALTER TABLE "order_item" ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,2);

-- AlterTable
ALTER TABLE "product" ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,2);
