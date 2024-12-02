/*
  Warnings:

  - You are about to drop the column `by_id` on the `EmojiPick` table. All the data in the column will be lost.
  - Added the required column `byId` to the `EmojiPick` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EmojiPick" DROP CONSTRAINT "EmojiPick_by_id_fkey";

-- AlterTable
ALTER TABLE "EmojiPick" DROP COLUMN "by_id",
ADD COLUMN     "byId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "EmojiPick" ADD CONSTRAINT "EmojiPick_byId_fkey" FOREIGN KEY ("byId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
