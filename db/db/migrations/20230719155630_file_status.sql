-- migrate:up
ALTER TABLE file_reference
ADD COLUMN IF NOT EXISTS status text CHECK (
  char_length(status) > 0
  and char_length(status) <= 1024
);

-- migrate:down
ALTER TABLE file_reference
DROP COLUMN IF EXISTS status;
