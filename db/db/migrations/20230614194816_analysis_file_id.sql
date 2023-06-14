-- migrate:up
ALTER TABLE analysis
ADD COLUMN IF NOT EXISTS file_reference_id UUID REFERENCES file_reference (id);

TRUNCATE analysis;

-- migrate:down
ALTER TABLE analysis
DROP COLUMN IF EXISTS file_reference_id;
