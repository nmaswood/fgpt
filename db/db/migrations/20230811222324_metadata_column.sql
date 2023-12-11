-- migrate:up
ALTER TABLE file_reference
ADD COLUMN IF NOT EXISTS metadata jsonb;

-- migrate:down
ALTER TABLE file_reference
DROP COLUMN IF EXISTS file_reference;
