/*
  Warnings:

  - You are about to drop the column `emoji` on the `Player` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Player" DROP COLUMN "emoji";

-- CreateTable
CREATE TABLE "EmojiPick" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "by_id" TEXT NOT NULL,

    CONSTRAINT "EmojiPick_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmojiPick" ADD CONSTRAINT "EmojiPick_by_id_fkey" FOREIGN KEY ("by_id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
