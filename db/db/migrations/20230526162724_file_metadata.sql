-- migrate:up
ALTER TABLE file_reference
ADD COLUMN IF NOT EXISTS file_size int CHECK (file_size >= 0);

ALTER TABLE processed_file
ADD COLUMN IF NOT EXISTS token_length int CHECK (token_length >= 0);

-- migrate:down
ALTER TABLE file_reference
DROP COLUMN IF EXISTS file_size;

ALTER TABLE processed_file
DROP COLUMN IF EXISTS token_length;
