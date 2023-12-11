-- migrate:up
CREATE TABLE
  IF NOT EXISTS prompt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    slug text CHECK (char_length(slug) <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
    updated_at TIMESTAMPTZ DEFAULT NOW () NOT NULL,
    definition jsonb NOT NULL
  );

CREATE UNIQUE INDEX IF NOT EXISTS "prompt_slug" ON "prompt" ("slug");

-- migrate:down
DROP TABLE IF EXISTS organization
DROP TABLE IF EXISTS app_user
