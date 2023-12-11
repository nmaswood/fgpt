-- migrate:up
ALTER TABLE file_reference
ADD COLUMN IF NOT EXISTS thumbnail_path text CHECK (
  char_length(thumbnail_path) > 0
  and char_length(thumbnail_path) <= 10000
);

-- migrate:down
ALTER TABLE file_reference
DROP COLUMN IF EXISTS thumbnail_path;
