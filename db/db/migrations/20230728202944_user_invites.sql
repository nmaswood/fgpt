-- migrate:up
CREATE TABLE
  IF NOT EXISTS app_user_invite (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    email text UNIQUE NOT NULL,
    organization_id UUID REFERENCES organization (id)
  );

-- migrate:down
DROP TABLE IF EXISTS app_user_invite;
