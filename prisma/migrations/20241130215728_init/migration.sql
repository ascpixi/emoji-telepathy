/*
  Warnings:

  - Added the required column `emoji` to the `EmojiPick` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmojiPick" ADD COLUMN     "emoji" TEXT NOT NULL;
