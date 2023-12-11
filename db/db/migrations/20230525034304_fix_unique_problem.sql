-- migrate:up
DROP INDEX IF EXISTS "text_chunk_uniq";

DROP INDEX IF EXISTS "text_chunk_uniq_v2";

DROP INDEX IF EXISTS "text_chunk_uniq_v3";

CREATE UNIQUE INDEX IF NOT EXISTS "text_chunk_uniq" ON "text_chunk" (
  "organization_id",
  "project_id",
  "file_reference_id",
  "processed_file_id",
  "text_chunk_group_id",
  "chunk_order"
);

ALTER TABLE text_chunk
DROP COLUMN IF EXISTS chunk_strategy;

-- migrate:down
