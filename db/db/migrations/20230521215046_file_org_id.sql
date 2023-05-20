-- migrate:up
ALTER TABLE file_reference
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organization (id) ON DELETE CASCADE;

UPDATE file_reference
SET
  organization_id = O.organization_id
FROM
  (
    SELECT
      FR.id,
      FR.project_id,
      P.organization_id
    FROM
      file_reference FR
      JOIN project P ON FR.project_id = P.id
  ) O
WHERE
  file_reference.id = O.id;

-- migrate:down
ALTER TABLE file_reference
DROP COLUMN IF EXISTS organization_id;
