-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "isSimulated" BOOLEAN NOT NULL DEFAULT false,
    "partnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHeartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmojiPick" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emoji" TEXT NOT NULL,
    "byId" TEXT NOT NULL,

    CONSTRAINT "EmojiPick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_partnerId_key" ON "Player"("partnerId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmojiPick" ADD CONSTRAINT "EmojiPick_byId_fkey" FOREIGN KEY ("byId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

