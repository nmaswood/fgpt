-- migrate:up
ALTER TABLE text_chunk_group
ADD COLUMN IF NOT EXISTS embeddings_will_be_generated BOOLEAN;

-- migrate:down
ALTER TABLE text_chunk_group
DROP COLUMN IF EXISTS embeddings_will_be_generated;
