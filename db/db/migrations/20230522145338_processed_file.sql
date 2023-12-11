-- migrate:up
CREATE TABLE
  IF NOT EXISTS processed_file (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    organization_id UUID REFERENCES organization (id),
    project_id UUID REFERENCES project (id),
    file_reference_id UUID REFERENCES file_reference (id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW () NOT NULL,
    extracted_text text,
    extracted_text_sha256 text
  );

CREATE UNIQUE INDEX IF NOT EXISTS "processed_file_uniq" ON "processed_file" (
  "organization_id",
  "project_id",
  "file_reference_id"
);

-- todo create indices later
-- migrate:down
DROP TABLE IF EXISTS processed_file;
