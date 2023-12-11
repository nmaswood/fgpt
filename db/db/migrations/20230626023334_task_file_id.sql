-- migrate:up
ALTER TABLE task
ADD COLUMN IF NOT EXISTS file_reference_id UUID REFERENCES file_reference (id);

-- migrate:down
ALTER TABLE task
DROP COLUMN IF EXISTS file_reference_id;
