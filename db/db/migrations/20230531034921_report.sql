-- migrate:up
CREATE TABLE
  IF NOT EXISTS report (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    organization_id UUID REFERENCES organization (id) NOT NULL,
    project_id UUID REFERENCES project (id) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW () NOT NULL,
    name TEXT CHECK (
      char_length(name) > 0
      and char_length(name) <= 1024
    ) NOT NULL,
    task_id UUID REFERENCES task (id),
    definition jsonb NOT NULL,
    output jsonb
  );

CREATE UNIQUE INDEX IF NOT EXISTS "report_name" ON "report" ("organization_id", "project_id", "name");

-- migrate:down
DROP TABLE IF EXISTS report;
