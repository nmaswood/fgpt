-- migrate:up
CREATE TABLE
  IF NOT EXISTS raw_chunk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    transcript_content_id UUID UNIQUE REFERENCES "transcript_content" (id),
    content text,
    num_tokens integer
  );

CREATE INDEX IF NOT EXISTS "raw_chunk_content_id " ON "raw_chunk" ("transcript_content_id");

CREATE TABLE
  IF NOT EXISTS summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    raw_chunk_id UUID UNIQUE REFERENCES "raw_chunk" (id),
    content text,
    num_tokens integer,
    diff integer
  );

CREATE INDEX IF NOT EXISTS "summary_raw_chunk_content_id " ON "summary" ("raw_chunk_id");

CREATE TABLE
  IF NOT EXISTS chunk_post_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    summary_id UUID UNIQUE REFERENCES "summary" (id),
    content text,
    embedding jsonb
  );

CREATE INDEX IF NOT EXISTS "chunk_post_summary_id " ON "chunk_post_summary" ("summary_id");

-- migrate:down
DROP TABLE IF EXISTS chunk_post_summary CASCADE;

DROP TABLE IF EXISTS summary CASCADE;

DROP TABLE IF EXISTS raw_chunk CASCADE;
