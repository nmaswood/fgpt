-- migrate:up
ALTER TABLE text_chunk
ADD COLUMN IF NOT EXISTS chunk_strategy text CHECK (char_length(chunk_strategy) > 0) NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "text_chunk_uniq_v2" ON "text_chunk" (
  "organization_id",
  "project_id",
  "file_reference_id",
  "processed_file_id",
  "chunk_order",
  "chunk_strategy"
);

-- migrate:down
DROP INDEX IF EXISTS text_chunk_uniq_v2;

ALTER TABLE text_chunk
DROP COLUMN IF EXISTS chunk_strategy;
