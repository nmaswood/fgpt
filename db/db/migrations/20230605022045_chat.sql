-- migrate:up
CREATE TABLE
  IF NOT EXISTS chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    organization_id UUID REFERENCES organization (id),
    project_id UUID REFERENCES project (id),
    creator_id UUID REFERENCES app_user (id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW () NOT NULL,
    name text CHECK (
      char_length(name) > 0
      and char_length(name) <= 1024
    ),
    model text CHECK (
      char_length(model) > 0
      and char_length(model) <= 1024
    ),
    UNIQUE (organization_id, project_id, name)
  );

CREATE INDEX IF NOT EXISTS "chat_organization_id" ON "chat" ("organization_id");

CREATE INDEX IF NOT EXISTS "chat_project_id" ON "chat" ("project_id");

CREATE TABLE
  IF NOT EXISTS chat_entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    organization_id UUID REFERENCES organization (id),
    project_id UUID REFERENCES project (id),
    creator_id UUID REFERENCES app_user (id),
    chat_id UUID REFERENCES chat (id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW () NOT NULL,
    entry_order INT CHECK (
      entry_order >= 0
      and entry_order <= 1000
    ) NOT NULL,
    question jsonb NOT NULL,
    answer jsonb,
    UNIQUE (chat_id, entry_order)
  );

CREATE INDEX IF NOT EXISTS "chat_entry_chat_id" ON "chat_entry" ("chat_id");

-- migrate:down
DROP TABLE IF EXISTS chat_entry;

DROP TABLE IF EXISTS chat;
