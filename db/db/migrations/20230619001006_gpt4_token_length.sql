-- migrate:up
ALTER TABLE processed_file
ADD COLUMN IF NOT EXISTS gpt4_token_length INT CHECK (gpt4_token_length >= 0)
-- migrate:down
ALTER TABLE processed_file
DROP COLUMN IF EXISTS gpt4_token_length;
