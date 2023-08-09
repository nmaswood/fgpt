-- migrate:up
ALTER TABLE IF EXISTS text_chunk_metrics
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS value;

ALTER TABLE IF EXISTS text_chunk_metrics
RENAME COLUMN metrics TO value;

ALTER TABLE IF EXISTS text_chunk_metrics
RENAME TO misc_output;

-- migrate:down
ALTER TABLE IF EXISTS misc_output
RENAME TO text_chunk_metrics;

ALTER TABLE IF EXISTS text_chunk_metrics
RENAME COLUMN value TO metrics;
