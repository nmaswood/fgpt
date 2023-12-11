-- migrate:up
CREATE TABLE
  IF NOT EXISTS organization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
    name text CHECK (char_length(name) <= 255)
  );

CREATE TABLE
  IF NOT EXISTS app_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    organization_id UUID REFERENCES organization (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
    google_sub text UNIQUE,
    email text UNIQUE NOT NULL,
    name text CHECK (char_length(name) <= 1024),
    given_name text CHECK (char_length(given_name) <= 1024),
    family_name text CHECK (char_length(family_name) <= 1024)
  );

CREATE UNIQUE INDEX IF NOT EXISTS "user_sub_idx" ON "app_user" ("google_sub");

-- migrate:down
DROP TABLE IF EXISTS organization
DROP TABLE IF EXISTS app_user
