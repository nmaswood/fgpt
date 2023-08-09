-- migrate:up
INSERT INTO
  prompt (slug, definition)
VALUES
  (
    'business_model',
    '{"template":"You are expert financial analyst evaluating data for an investment.\n\nGiven the document below, develop an overview of the business model and key revenue lines and drivers.\nProvide output in markdown tables and include relevant data-points or objective commentary on trends.\nBe fully objective and neutral in your descriptions.\n\nDocument:  {paredo_document}"}'
  ) ON CONFLICT DO NOTHING;

INSERT INTO
  prompt (slug, definition)
VALUES
  (
    'expense_drivers',
    '{"template":"You are expert financial analyst evaluating data for an investment.\n\nGiven the document below, provide a detailed overview of the expenses and the key drivers. Provide output in markdown tables and include data-points, such as the % of total sales or revenue, and objective commentary, trends, or things that could cause decreases or increases.\n\nDocument:  {paredo_document}"}'
  ) ON CONFLICT DO NOTHING;

INSERT INTO
  prompt (slug, definition)
VALUES
  (
    'ebitda_adjustments',
    '{"template":"You are expert financial analyst evaluating data for an investment.\n\nGiven the document below Develop a thorough, accurate, and objective analysis of the EBITDA adjustments.\nThen develop a more plausible adjusted EBITDA, make any changes to the adjustments made.\nPlease make all analysis with full accounting standards and as an objective financial analyst would.\n\nDevelop the best output and format for that analysis, such as a markdown table\n\nDocument:  {paredo_document}"}'
  ) ON CONFLICT DO NOTHING;

-- migrate:down
DELETE FROM prompt
WHERE
  slug IN (
    'business_model',
    'expense_drivers',
    'ebitda_adjustments'
  );
