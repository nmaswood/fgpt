-- migrate:up
CREATE TABLE
  IF NOT EXISTS show_case_file (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    project_id UUID NOT NULL REFERENCES project (id),
    file_reference_id UUID NOT NULL REFERENCES file_reference (id)
  );

CREATE UNIQUE INDEX IF NOT EXISTS "show_case_file_project" ON "show_case_file" ("project_id");

-- migrate:down
DROP TABLE IF EXISTS show_case_file;
