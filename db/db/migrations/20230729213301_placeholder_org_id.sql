-- migrate:up
INSERT INTO
  organization (id, name)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'Placeholder Org'
  ) ON CONFLICT DO NOTHING;

-- migrate:down
DELETE FROM organization
WHERE
  id = '00000000-0000-0000-0000-000000000000';
