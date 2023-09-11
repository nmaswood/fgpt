-- migrate:up
INSERT INTO
  prompt (slug, definition)
VALUES
  (
    'hfm',
    '{"template":"You are expert financial analyst evaluating data for an investment.\n\nGiven the document below, your task is to provide up the 5 most important methods of analysis to understand the investment.\n\nThen, after a line seperator ' ___ ' provide up to 5 different investment perspectives to analyze the document e.g. risk averse persona, etc.\n\nOutput each analysis on a seperate bullet point e.g.\n\n- analysis 1\n- analysis 2\n- analysis ...\n\nDocument: {paredo_document}"}'
  ) ON CONFLICT DO NOTHING;

-- migrate:down
DELETE FROM prompt
WHERE
  slug IN ('hfm');
