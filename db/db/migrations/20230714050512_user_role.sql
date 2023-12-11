-- migrate:up
ALTER TABLE app_user
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- migrate:down
ALTER TABLE app_user
DROP COLUMN IF EXISTS role;
