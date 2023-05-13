-- migrate:up
CREATE TABLE
  IF NOT EXISTS project (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
    name text CHECK (char_length(name) <= 255),
    description text CHECK (char_length(description) <= 1024),
    organization_id UUID REFERENCES organization (id) ON DELETE CASCADE,
    creator_user_id UUID REFERENCES app_user (id) ON DELETE CASCADE,
    UNIQUE (organization_id, name)
  );

CREATE INDEX IF NOT EXISTS "project_org_id" ON "project" ("organization_id");

-- migrate:down
DROP TABLE IF EXISTS project;
