-- migrate:up
DROP TABLE IF EXISTS raw_chunk,
summary,
chunk_post_summary,
transcript_content,
transcript_href;

-- migrate:down
