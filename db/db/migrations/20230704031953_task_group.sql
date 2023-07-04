-- migrate:up
CREATE TABLE
  IF NOT EXISTS task_group (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    organization_id UUID REFERENCES organization (id),
    project_id UUID REFERENCES project (id),
    file_reference_id UUID REFERENCES file_reference (id),
    description text NOT NULL,
    pending_tasks jsonb NOT NULL,
    completed_tasks jsonb NOT NULL,
    failed_tasks jsonb NOT NULL
  );

-- migrate:down
DROP TABLE IF EXISTS task_group;
