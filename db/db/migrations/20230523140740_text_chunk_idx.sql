-- migrate:up
CREATE UNIQUE INDEX IF NOT EXISTS "text_chunk_uniq_v3" ON "text_chunk" (
  "organization_id",
  "project_id",
  "file_reference_id",
  "processed_file_id",
  "chunk_order",
  "chunk_strategy",
  "chunk_text_sha256"
);

-- migrate:down
DROP INDEX IF EXISTS text_chunk_uniq_v3;
