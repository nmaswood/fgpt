-- migrate:up
CREATE TABLE
  IF NOT EXISTS text_chunk_entity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    organization_id UUID REFERENCES organization (id),
    project_id UUID REFERENCES project (id),
    file_reference_id UUID REFERENCES file_reference (id),
    processed_file_id UUID REFERENCES processed_file (id),
    text_chunk_group_id UUID REFERENCES text_chunk_group (id),
    text_chunk_id UUID REFERENCES text_chunk (id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW () NOT NULL,
    value text NOT NULL,
    hash_sha256 text NOT NULL
  );

-- migrate:down
DROP TABLE IF EXISTS text_chunk_entity;
