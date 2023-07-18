-- migrate:up
DROP TABLE IF EXISTS task_group;

DROP TABLE IF EXISTS analysis;

DROP TABLE IF EXISTS text_chunk_entity;

ALTER TABLE text_chunk_group
DROP COLUMN IF EXISTS llm_output_generated,
DROP COLUMN IF EXISTS llm_output_chunks_seen,
DROP COLUMN IF EXISTS max_chunk_order_seen,
DROP COLUMN IF EXISTS max_chunk_embeding_order_seen,;

-- migrate:down
