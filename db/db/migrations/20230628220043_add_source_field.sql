-- migrate:up
ALTER TABLE excel_analysis
ADD COLUMN IF NOT EXISTS source text CHECK (char_length(source) <= 1024);

-- migrate:down
ALTER TABLE excel_analysis
DROP COLUMN IF EXISTS source;
