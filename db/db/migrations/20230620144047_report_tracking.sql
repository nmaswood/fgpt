-- migrate:up
ALTER TABLE text_chunk_group
ADD COLUMN IF NOT EXISTS llm_output_generated BOOLEAN,
ADD COLUMN IF NOT EXISTS llm_output_chunks_seen INT CHECK (llm_output_chunks_seen >= 0);

-- migrate:down
ALTER TABLE text_chunk_group
DROP COLUMN IF EXISTS llm_output_generated,
DROP COLUMN IF EXISTS llm_output_chunks_seen;
