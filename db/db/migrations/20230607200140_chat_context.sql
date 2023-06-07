-- migrate:up
ALTER TABLE chat_entry
ADD COLUMN IF NOT EXISTS context_v2 jsonb;

-- migrate:down
ALTER TABLE chat_entry
DROP COLUMN IF EXISTS context_v2;
