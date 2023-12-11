-- migrate:up
ALTER TABLE excel_analysis
DROP COLUMN IF EXISTS sheet_number;

-- migrate:down
