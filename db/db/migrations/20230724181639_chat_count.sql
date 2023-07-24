-- migrate:up
ALTER TABLE project
ADD COLUMN IF NOT EXISTS chat_count int CHECK (chat_count >= 0);

-- migrate:down
ALTER TABLE project
DROP COLUMN IF EXISTS chat_count;
