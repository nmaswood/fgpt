-- migrate:up
CREATE TABLE
  IF NOT EXISTS file_reference (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    file_name text NOT NULL,
    bucket_name text NOT NULL,
    content_type text,
    uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW ()
  );

CREATE TABLE
  IF NOT EXISTS processed_file (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    file_reference_id UUID NOT NULL REFERENCES file_reference (id),
    content text
  );

-- migrate:down
DROP TABLE IF EXISTS processed_file;

DROP TABLE IF EXISTS file_reference;
