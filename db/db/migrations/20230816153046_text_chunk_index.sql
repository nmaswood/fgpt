-- migrate:up
ALTER TABLE project
DROP COLUMN IF exists description;

ALTER TABLE text_chunk
ADD COLUMN IF NOT EXISTS page_start int CHECK (page_start >= 0),
ADD COLUMN IF NOT EXISTS page_end int CHECK (page_end >= 0);

-- migrate:down
ALTER TABLE text_chunk
DROP COLUMN IF EXISTS page_start,
DROP COLUMN IF EXISTS page_end;
