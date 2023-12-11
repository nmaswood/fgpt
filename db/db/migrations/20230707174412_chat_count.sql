-- migrate:up
ALTER TABLE chat
ADD COLUMN IF NOT EXISTS chat_entry_count int CHECK (chat_entry_count >= 0);

-- migrate:down
ALTER TABLE chat
DROP COLUMN IF EXISTS chat_entry_count;
