-- migrate:up
ALTER TABLE chat_entry
DROP COLUMN IF EXISTS question,
ADD COLUMN IF NOT EXISTS question_v2 text CHECK (char_length(question_v2) <= 10000),
ADD COLUMN IF NOT EXISTS context text;

-- migrate:down
ALTER TABLE chat_entry
ADD COLUMN IF NOT EXISTS question jsonb,
DROP COLUMN IF EXISTS question_v2,
DROP COLUMN IF EXISTS context;
