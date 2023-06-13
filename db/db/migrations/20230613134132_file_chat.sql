-- migrate:up
ALTER TABLE chat
ADD COLUMN IF NOT EXISTS file_reference_id UUID REFERENCES file_reference (id);

-- migrate:down
ALTER TABLE chat
DROP COLUMN IF EXISTS file_reference_id;
