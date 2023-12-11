-- migrate:up
ALTER TABLE chat_entry
DROP COLUMN IF EXISTS context;

DROP TABLE IF EXISTS text_chunk_summary;

-- migrate:down
