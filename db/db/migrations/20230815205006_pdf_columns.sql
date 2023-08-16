-- migrate:up
ALTER TABLE processed_file
ADD COLUMN IF NOT EXISTS num_pages int CHECK (num_pages >= 0),
ADD COLUMN IF NOT EXISTS text_with_pages jsonb;

-- migrate:down
ALTER TABLE processed_file
DROP COLUMN IF EXISTS num_pages,
DROP COLUMN IF EXISTS text_with_pages;
