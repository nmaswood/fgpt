-- migrate:up
ALTER TABLE chat
drop constraint IF EXISTS chat_organization_id_project_id_name_key;

-- migrate:down
