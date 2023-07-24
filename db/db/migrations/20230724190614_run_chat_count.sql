-- migrate:up
UPDATE project
SET
  chat_count = (
    SELECT
      COUNT(*)
    FROM
      chat
    WHERE
      project.id = chat.project_id
  );

-- migrate:down
