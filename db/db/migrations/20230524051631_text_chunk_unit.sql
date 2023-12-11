-- migrate:up
-- WARNING THIS DROPS text_chunk TABLE
-- this avoids a potential migration on the little production
-- data that exists
TRUNCATE TABLE text_chunk,
task,
file_reference,
processed_file CASCADE;

CREATE TABLE
  IF NOT EXISTS text_chunk_group (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    organization_id UUID REFERENCES organization (id),
    project_id UUID REFERENCES project (id),
    file_reference_id UUID REFERENCES file_reference (id),
    processed_file_id UUID REFERENCES processed_file (id),
    num_chunks int CHECK (num_chunks > 0) NOT NULL,
    max_chunk_order_seen int CHECK (
      max_chunk_order_seen >= 0
      AND num_chunks >= max_chunk_order_seen
    ),
    max_chunk_embedding_order_seen int CHECK (
      max_chunk_embedding_order_seen >= 0
      AND num_chunks >= max_chunk_embedding_order_seen
    ),
    fully_chunked BOOLEAN DEFAULT FALSE NOT NULL,
    fully_embedded BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW () NOT NULL,
    chunk_strategy text CHECK (char_length(chunk_strategy) > 0) NOT NULL,
    embedding_strategy text CHECK (char_length(embedding_strategy) > 0) NOT NULL,
    embedding_size int CHECK (embedding_size > 0) NOT NULL
  );

CREATE UNIQUE INDEX IF NOT EXISTS "text_chunk_group_uniq" ON "text_chunk_group" (
  "organization_id",
  "project_id",
  "file_reference_id",
  "processed_file_id",
  "chunk_strategy",
  "embedding_strategy"
);

ALTER TABLE text_chunk
ADD COLUMN IF NOT EXISTS text_chunk_group_id UUID REFERENCES text_chunk_group (id) NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "text_chunk_uniq_v3" ON "text_chunk" (
  "organization_id",
  "project_id",
  "file_reference_id",
  "processed_file_id",
  "text_chunk_group_id",
  "chunk_order"
);

ALTER TABLE text_chunk
DROP COLUMN IF EXISTS chunk_strategy,
DROP COLUMN IF EXISTS embedding_strategy,
DROP COLUMN IF EXISTS embedding_size,
DROP COLUMN IF EXISTS chunker;

-- migrate:down
ALTER TABLE text_chunk
DROP COLUMN IF EXISTS text_chunk_group_id;

DROP INDEX IF EXISTS text_chunk_uniq_v3;

DROP TABLE IF EXISTS text_chunk_group;
