-- migrate:up
CREATE INDEX IF NOT EXISTS "task_file_ref_id" ON "task" ("file_reference_id");

CREATE INDEX IF NOT EXISTS "text_chunk_metrics_file_ref_id" ON "text_chunk_metrics" ("file_reference_id");

-- migrate:down
DROP INDEX IF EXISTS "task_file_ref_id";

DROP INDEX IF EXISTS "text_chunk_metrics_file_ref_id";
