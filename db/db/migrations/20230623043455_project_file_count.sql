-- migrate:up
ALTER TABLE project
ADD COLUMN IF NOT EXISTS file_count int CHECK (file_count >= 0);

-- migrate:down
ALTER TABLE project
DROP COLUMN IF EXISTS file_count;
