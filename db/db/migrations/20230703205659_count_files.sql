-- migrate:up
UPDATE organization
SET
  project_count = (
    SELECT
      COUNT(*)
    FROM
      project
    WHERE
      project.organization_id = organization.id
  );

UPDATE project
SET
  file_count = (
    SELECT
      COUNT(*)
    FROM
      file_reference
    WHERE
      file_reference.project_id = project.id
  );
