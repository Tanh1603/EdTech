ALTER TABLE "material_chunks" ADD COLUMN "preview" TEXT;
ALTER TABLE "material_chunks" ADD COLUMN "storage_key" TEXT;
ALTER TABLE "material_chunks" ADD COLUMN "page_no" INTEGER;
ALTER TABLE "material_chunks" ADD COLUMN "source" JSONB;

UPDATE "material_chunks"
SET "preview" = LEFT("content", 500)
WHERE "preview" IS NULL;
