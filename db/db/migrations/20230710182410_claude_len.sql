-- migrate:up
ALTER TABLE processed_file
ADD COLUMN IF NOT EXISTS claude_100k_length INT CHECK (claude_100k_length >= 0)
-- migrate:down
ALTER TABLE processed_file
DROP COLUMN IF EXISTS claude_100k_length;
