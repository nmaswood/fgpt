-- migrate:up
CREATE TABLE
  IF NOT EXISTS file_reference (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    project_id UUID NOT NULL REFERENCES project (id),
    file_name text CHECK (char_length(file_name) <= 1024) NOT NULL,
    bucket_name text CHECK (char_length(bucket_name) <= 1024) NOT NULL,
    content_type text CHECK (char_length(content_type) <= 1024),
    uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW ()
  );

CREATE INDEX IF NOT EXISTS "project_file_reference" ON "file_reference" ("project_id");

-- migrate:down
DROP TABLE IF EXISTS file_reference;
