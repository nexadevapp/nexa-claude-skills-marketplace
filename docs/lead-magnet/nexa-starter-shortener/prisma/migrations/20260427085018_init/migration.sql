-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "passwordHash" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "links" (
    "id" BIGSERIAL NOT NULL,
    "slug" VARCHAR(32) NOT NULL,
    "destinationUrl" VARCHAR(2048) NOT NULL,
    "ownerId" BIGINT,
    "creatorIp" VARCHAR(45) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "links_slug_key" ON "links"("slug");

-- CreateIndex
CREATE INDEX "links_creatorIp_createdAt_idx" ON "links"("creatorIp", "createdAt");

-- CreateIndex
CREATE INDEX "links_ownerId_createdAt_idx" ON "links"("ownerId", "createdAt");

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
