-- migrate:up
UPDATE file_reference
SET
  status = 'ready'
WHERE
  status IS NULL;

-- migrate:down
