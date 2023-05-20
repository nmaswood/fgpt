-- migrate:up
ALTER TABLE file_reference
ADD COLUMN IF NOT EXISTS hash_sha256 text;

-- migrate:down
ALTER TABLE file_reference
DROP COLUMN IF EXISTS hash_sha256;
