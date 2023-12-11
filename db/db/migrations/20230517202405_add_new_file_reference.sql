-- migrate:up
ALTER TABLE file_reference
ADD COLUMN IF NOT EXISTS path text;

-- migrate:down
ALTER TABLE file_reference
DROP COLUMN IF EXISTS path;
