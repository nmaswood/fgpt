-- migrate:up
CREATE TABLE
  IF NOT EXISTS excel_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    organization_id UUID REFERENCES organization (id),
    project_id UUID REFERENCES project (id),
    file_reference_id UUID REFERENCES file_reference (id),
    excel_asset_id UUID REFERENCES excel_asset (id),
    sheet_number integer NOT NULL CHECK (sheet_number >= 0),
    output jsonb NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW () NOT NULL
  );

-- migrate:down
DROP TABLE IF EXISTS excel_analysis;
