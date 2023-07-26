-- migrate:up
ALTER TABLE chat_entry
ADD COLUMN IF NOT EXISTS prompt text;

-- migrate:down
ALTER TABLE chat_entry
DROP COLUMN IF EXISTS prompt;
