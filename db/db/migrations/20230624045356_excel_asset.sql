-- migrate:up
CREATE TABLE
  IF NOT EXISTS excel_asset (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    organization_id UUID REFERENCES organization (id),
    project_id UUID REFERENCES project (id),
    file_reference_id UUID REFERENCES file_reference (id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW () NOT NULL,
    bucket_name text NOT NULL,
    path text CHECK (char_length(path) > 0) NOT NULL,
    num_sheets integer NOT NULL CHECK (num_sheets > 0)
  );

-- migrate:down
DROP TABLE IF EXISTS excel_asset;
