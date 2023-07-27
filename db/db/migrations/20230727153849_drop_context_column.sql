-- migrate:up
ALTER TABLE chat_entry
DROP COLUMN IF EXISTS context_v2;

ALTER TABLE chat_entry
ADD COLUMN IF NOT EXISTS answer_v2 text;

-- migrate:down
ALTER TABLE chat_entry
DROP COLUMN IF EXISTS answer_v2;
