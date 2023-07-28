-- migrate:up
ALTER TABLE app_user
ADD COLUMN IF NOT EXISTS status text 
DEFAULT 'inactive'::text NOT NULL
CHECK (
  char_length(status) >= 0
  and char_length(status) <= 255
) 

-- migrate:down
ALTER TABLE app_user
DROP COLUMN IF EXISTS status;
