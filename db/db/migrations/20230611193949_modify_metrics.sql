-- migrate:up
ALTER TABLE text_chunk_metrics
ADD COLUMN IF NOT EXISTS description text CHECK (char_length(description) <= 1024),
ADD COLUMN IF NOT EXISTS value text CHECK (char_length(value) <= 1024);

-- migrate:down
ALTER TABLE text_chunk_metrics
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS value;
