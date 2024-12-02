-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emoji" TEXT,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_partnerId_key" ON "Player"("partnerId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
