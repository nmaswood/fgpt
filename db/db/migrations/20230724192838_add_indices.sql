-- migrate:up
CREATE INDEX IF NOT EXISTS "project_question" ON "text_chunk_question" ("project_id");

CREATE INDEX IF NOT EXISTS "file_question" ON "text_chunk_question" ("file_reference_id");

-- migrate:down
DROP INDEX IF EXISTS "project_question";

DROP INDEX IF EXISTS "file_question";
