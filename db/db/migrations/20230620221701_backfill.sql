-- migrate:up
UPDATE text_chunk_group
SET
  llm_output_chunks_seen = num_chunks,
  llm_output_generated = true
WHERE
  llm_output_generated IS null
  AND text_chunk_group.id IN (
    SELECT DISTINCT
      text_chunk_group_id
    from
      text_chunk_metrics
  );

-- migrate:down
