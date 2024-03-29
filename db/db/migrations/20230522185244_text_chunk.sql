-- migrate:up
CREATE TABLE
  IF NOT EXISTS text_chunk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    organization_id UUID REFERENCES organization (id),
    project_id UUID REFERENCES project (id),
    file_reference_id UUID REFERENCES file_reference (id),
    processed_file_id UUID REFERENCES processed_file (id),
    chunk_order int CHECK (chunk_order >= 0) NOT NULL,
    chunk_text text CHECK (char_length(chunk_text) > 0) NOT NULL,
    chunk_text_sha256 text,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW () NOT NULL,
    embedding jsonb
  );

CREATE UNIQUE INDEX IF NOT EXISTS "text_chunk_uniq" ON "text_chunk" (
  "organization_id",
  "project_id",
  "file_reference_id",
  "processed_file_id",
  "chunk_order",
  "chunk_text_sha256"
);

-- migrate:down
DROP TABLE IF EXISTS text_chunk;
