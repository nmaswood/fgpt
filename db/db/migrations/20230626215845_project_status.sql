-- migrate:up
ALTER TABLE project
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'not_deleted';

-- migrate:down
ALTER TABLE project
DROP COLUMN IF EXISTS status;
