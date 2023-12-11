-- migrate:up
ALTER TABLE organization
ADD COLUMN IF NOT EXISTS project_count int CHECK (project_count >= 0);

-- migrate:down
ALTER TABLE organization
DROP COLUMN IF EXISTS project_count;
