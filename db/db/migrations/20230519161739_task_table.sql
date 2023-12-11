-- migrate:up
CREATE TABLE
  IF NOT EXISTS task (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    organization_id UUID REFERENCES organization (id),
    project_id UUID REFERENCES project (id),
    task_type text CHECK (char_length(task_type) <= 1024) NOT NULL,
    status text CHECK (char_length(status) <= 1024) NOT NULL,
    status_updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW () NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW () NOT NULL,
    finished_at TIMESTAMP WITHOUT TIME ZONE,
    config jsonb,
    success_output jsonb,
    error_output jsonb
  );

CREATE INDEX IF NOT EXISTS "task_organization_id" ON "task" ("organization_id");

CREATE INDEX IF NOT EXISTS "task_project_id" ON "task" ("project_id");

CREATE INDEX IF NOT EXISTS "task_status" ON "task" ("status");

-- migrate:down
DROP TABLE IF EXISTS task;
