-- migrate:up
ALTER TABLE file_reference
ADD COLUMN IF NOT EXISTS description text CHECK (char_length(description) <= 5000);

-- migrate:down
ALTER TABLE file_reference
DROP COLUMN IF EXISTS description;
